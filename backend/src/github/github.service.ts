import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { AuthUser } from '../auth/auth.service';

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);

  private async fetchGitHub(endpoint: string, accessToken: string) {
    const response = await fetch(`https://api.github.com${endpoint}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'DevBoard-Backend',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      this.logger.error(`GitHub API error on ${endpoint} [${response.status}]: ${errText}`);
      throw new HttpException(
        `GitHub API returned ${response.status}: ${response.statusText}`,
        response.status || HttpStatus.BAD_GATEWAY,
      );
    }

    return response.json();
  }

  // 1. Lấy thông tin Profile chi tiết
  async getProfile(user: AuthUser) {
    return this.fetchGitHub('/user', user.accessToken);
  }

  // 2. Lấy danh sách Repositories (Cả Public & Private được cấp quyền)
  async getRepositories(user: AuthUser, perPage = 30) {
    return this.fetchGitHub(`/user/repos?sort=updated&per_page=${perPage}&affiliation=owner,collaborator`, user.accessToken);
  }

  // 3. Lấy thông báo Notifications thật (Phục vụ cho tab Messages)
  async getNotifications(user: AuthUser) {
    return this.fetchGitHub('/notifications?all=false', user.accessToken);
  }

  // 4. Lấy dòng thời gian sự kiện (Commits, PRs, Reviews)
  async getUserEvents(user: AuthUser, perPage = 100) {
    try {
      const events = await this.fetchGitHub(`/users/${user.login}/events?per_page=${perPage}`, user.accessToken);
      return Array.isArray(events) ? events : [];
    } catch (err: any) {
      this.logger.warn(`getUserEvents failed for @${user.login}: ${err.message}. Falling back to public events...`);
      try {
        const publicRes = await fetch(`https://api.github.com/users/${user.login}/events?per_page=${perPage}`, {
          headers: { 'User-Agent': 'DevBoard-Backend' },
        });
        if (publicRes.ok) {
          return await publicRes.json();
        }
      } catch (e: any) {
        this.logger.error(`Public events fallback failed: ${e.message}`);
      }
      return [];
    }
  }

  // 5. Lấy toàn bộ Contribution Calendar trong 1 năm qua GitHub GraphQL API
  async getContributions(user: AuthUser, year?: number) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const targetYear = year || currentYear;
    const from = `${targetYear}-01-01T00:00:00Z`;
    // Với năm hiện tại, chỉ truy vấn đến thời điểm hiện tại để tránh sinh các ngày tương lai rỗng
    const to = targetYear === currentYear ? now.toISOString() : `${targetYear}-12-31T23:59:59Z`;

    const makeQuery = (fromDate: string, toDate?: string) => ({
      query: `
        query($from: DateTime${toDate ? ', $to: DateTime' : ''}) {
          viewer {
            contributionsCollection(from: $from${toDate ? ', to: $to' : ''}) {
              startedAt
              endedAt
              totalCommitContributions
              totalPullRequestContributions
              totalIssueContributions
              totalPullRequestReviewContributions
              totalRepositoryContributions
              restrictedContributionsCount
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    date
                    contributionCount
                    contributionLevel
                    color
                    weekday
                  }
                }
                months {
                  name
                  year
                  firstDay
                  totalWeeks
                }
              }
            }
          }
        }
      `,
      variables: {
        from: fromDate,
        ...(toDate ? { to: toDate } : {}),
      },
    });

    try {
      // 1. Thử truy vấn từ ngày 01/01 đến 31/12 của năm thông qua viewer (bao gồm cả repo Private được cấp quyền)
      let response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'DevBoard-Backend',
        },
        body: JSON.stringify(makeQuery(from, to)),
      });

      let resData = await response.json();

      // 2. Nếu GitHub từ chối mốc tương lai của năm hiện tại, tự động fallback truy vấn từ 01/01 đến hiện tại
      if (resData.errors && resData.errors.length > 0) {
        this.logger.warn(`Retrying GitHub GraphQL query for @${user.login} without future 'to' date...`);
        response = await fetch('https://api.github.com/graphql', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
            'Content-Type': 'application/json',
            'User-Agent': 'DevBoard-Backend',
          },
          body: JSON.stringify(makeQuery(from)),
        });
        resData = await response.json();
      }

      if (resData.errors && resData.errors.length > 0) {
        this.logger.error(`GitHub GraphQL errors: ${JSON.stringify(resData.errors)}`);
        throw new HttpException(
          `GitHub GraphQL error: ${resData.errors[0]?.message || 'GraphQL error'}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      const coll = resData.data?.viewer?.contributionsCollection || resData.data?.user?.contributionsCollection;

      if (coll) {
        // Tổng tất cả các loại đóng góp chuẩn theo công thức hiển thị headline của GitHub
        const sumAll =
          (coll.totalCommitContributions || 0) +
          (coll.totalPullRequestContributions || 0) +
          (coll.totalIssueContributions || 0) +
          (coll.totalPullRequestReviewContributions || 0) +
          (coll.totalRepositoryContributions || 0) +
          (coll.restrictedContributionsCount || 0);

        const total = Math.max(sumAll, coll.contributionCalendar?.totalContributions || 0);

        coll.totalAnnualContributions = total;

        if (coll.contributionCalendar) {
          coll.contributionCalendar.totalContributions = total;
        }

        this.logger.log(
          `[Contributions] for @${user.login} (year=${targetYear}): ` +
          `totalAnnualContributions=${coll.totalAnnualContributions}, ` +
          `calendarTotal=${coll.contributionCalendar?.totalContributions}, ` +
          `commits=${coll.totalCommitContributions}, ` +
          `prs=${coll.totalPullRequestContributions}, ` +
          `issues=${coll.totalIssueContributions}, ` +
          `reviews=${coll.totalPullRequestReviewContributions}, ` +
          `repos=${coll.totalRepositoryContributions}, ` +
          `restricted=${coll.restrictedContributionsCount}`
        );
      }

      return coll;
    } catch (err: any) {
      this.logger.error(`Error fetching contributions for @${user.login}: ${err.message}`);
      throw err;
    }
  }

  // Lấy tổng số commit chính xác thông qua Link header của HEAD request (1 call nhẹ)
  async getRepoTotalCommits(user: AuthUser, owner: string, name: string): Promise<number> {
    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${name}/commits?per_page=1`, {
        method: 'HEAD',
        headers: {
          ...(user?.accessToken ? { Authorization: `Bearer ${user.accessToken}` } : {}),
          'User-Agent': 'DevBoard-Backend',
          Accept: 'application/vnd.github.v3+json',
        },
      });
      if (!res.ok) return 0;
      const link = res.headers.get('link');
      if (link) {
        const match = link.match(/[?&]page=(\d+)[^>]*>;\s*rel="last"/);
        if (match) return parseInt(match[1], 10);
      }
      return 1;
    } catch (e: any) {
      this.logger.warn(`Could not determine total commits for ${owner}/${name}: ${e.message}`);
      return 0;
    }
  }

  // 6. Lấy danh sách commits của một repository cụ thể kèm tổng số commit và hỗ trợ tải nhiều trang
  async getRepoCommits(user: AuthUser, repoName: string, page = 1, perPage = 100, fetchAll = false) {
    if (!repoName) return { commits: [], totalCount: 0, page: 1, hasMore: false };
    const owner = repoName.includes('/') ? repoName.split('/')[0] : user.login;
    const name = repoName.includes('/') ? repoName.split('/')[1] : repoName;

    const totalCountPromise = this.getRepoTotalCommits(user, owner, name);

    const fetchSinglePage = async (p: number) => {
      try {
        const data = await this.fetchGitHub(
          `/repos/${owner}/${name}/commits?per_page=${perPage}&page=${p}`,
          user.accessToken,
        );
        return Array.isArray(data) ? data : [];
      } catch (err: any) {
        try {
          const res = await fetch(`https://api.github.com/repos/${owner}/${name}/commits?per_page=${perPage}&page=${p}`, {
            headers: {
              ...(user?.accessToken ? { Authorization: `Bearer ${user.accessToken}` } : {}),
              'User-Agent': 'DevBoard-Backend',
              Accept: 'application/vnd.github.v3+json',
            },
          });
          if (res.ok) {
            const data = await res.json();
            return Array.isArray(data) ? data : [];
          }
        } catch (e: any) {
          this.logger.error(`Public commits page ${p} failed for ${owner}/${name}: ${e.message}`);
        }
        return [];
      }
    };

    try {
      let commits = await fetchSinglePage(page);
      const totalCount = await totalCountPromise;

      // Nếu repo có quy mô vừa phải (<= 300 commits) và đang yêu cầu page 1, tự động kéo hết các trang còn lại để hiển thị đầy đủ
      if ((fetchAll || totalCount <= 300) && totalCount > perPage && page === 1) {
        const totalPages = Math.ceil(totalCount / perPage);
        for (let p = 2; p <= Math.min(totalPages, 5); p++) {
          const nextBatch = await fetchSinglePage(p);
          if (nextBatch.length > 0) {
            commits = commits.concat(nextBatch);
          }
        }
      }

      const effectiveTotal = Math.max(totalCount, commits.length);
      const hasMore = commits.length < effectiveTotal;

      return {
        commits,
        totalCount: effectiveTotal,
        page,
        hasMore,
      };
    } catch (err: any) {
      this.logger.error(`Failed to fetch commits for ${owner}/${name}: ${err.message}`);
      return { commits: [], totalCount: 0, page, hasMore: false };
    }
  }

  // 7. Lấy danh sách Pull Requests của repository
  async getRepoPulls(user: AuthUser, repoName: string, state = 'all', perPage = 30) {
    if (!repoName) return [];
    const owner = repoName.includes('/') ? repoName.split('/')[0] : user.login;
    const name = repoName.includes('/') ? repoName.split('/')[1] : repoName;

    try {
      const pulls = await this.fetchGitHub(
        `/repos/${owner}/${name}/pulls?state=${state}&per_page=${perPage}&sort=updated`,
        user.accessToken,
      );
      return Array.isArray(pulls) ? pulls : [];
    } catch (err: any) {
      this.logger.warn(`Failed to fetch pulls for ${owner}/${name}: ${err.message}. Trying public API...`);
      try {
        const res = await fetch(`https://api.github.com/repos/${owner}/${name}/pulls?state=${state}&per_page=${perPage}&sort=updated`, {
          headers: {
            'User-Agent': 'DevBoard-Backend',
            Accept: 'application/vnd.github.v3+json',
          },
        });
        if (res.ok) {
          const data = await res.json();
          return Array.isArray(data) ? data : [];
        }
      } catch (e: any) {
        this.logger.error(`Public pulls fallback failed for ${owner}/${name}: ${e.message}`);
      }
      return [];
    }
  }

  // 8. Lấy danh sách Branches của repository
  async getRepoBranches(user: AuthUser, repoName: string, perPage = 30) {
    if (!repoName) return [];
    const owner = repoName.includes('/') ? repoName.split('/')[0] : user.login;
    const name = repoName.includes('/') ? repoName.split('/')[1] : repoName;

    try {
      const branches = await this.fetchGitHub(
        `/repos/${owner}/${name}/branches?per_page=${perPage}`,
        user.accessToken,
      );
      return Array.isArray(branches) ? branches : [];
    } catch (err: any) {
      this.logger.warn(`Failed to fetch branches for ${owner}/${name}: ${err.message}. Trying public API...`);
      try {
        const res = await fetch(`https://api.github.com/repos/${owner}/${name}/branches?per_page=${perPage}`, {
          headers: {
            'User-Agent': 'DevBoard-Backend',
            Accept: 'application/vnd.github.v3+json',
          },
        });
        if (res.ok) {
          const data = await res.json();
          return Array.isArray(data) ? data : [];
        }
      } catch (e: any) {
        this.logger.error(`Public branches fallback failed for ${owner}/${name}: ${e.message}`);
      }
      return [];
    }
  }
}

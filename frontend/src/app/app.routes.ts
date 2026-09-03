import { Routes } from '@angular/router';

export const routes: Routes = [
    // 1. Flow 1: Public routes for Landing / Login Page
    {
        path: '',
        loadComponent: () => import('./pages/landing/landing.component').then(m => m.LandingComponent)
    },
    {
        path: 'login',
        redirectTo: '',
        pathMatch: 'full'
    },
    // 2. Flow 2: Authenticated Main Layout
    {
        path: 'app',
        loadComponent: () => import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
        children: [
            { path: '', redirectTo: 'dashboard/overview', pathMatch: 'full' },
            { 
                path: 'dashboard/overview', 
                loadComponent: () => import('./pages/dashboard/overview/overview.component').then(m => m.OverviewComponent) 
            },
            { 
                path: 'dashboard/analytics', 
                loadComponent: () => import('./pages/dashboard/analytics/analytics.component').then(m => m.AnalyticsComponent) 
            },
            { 
                path: 'projects/all-projects', 
                loadComponent: () => import('./pages/projects/all-projects/all-projects.component').then(m => m.AllProjectsComponent) 
            },
            { 
                path: 'projects/bookmarks', 
                loadComponent: () => import('./pages/projects/bookmarks/bookmarks.component').then(m => m.BookmarksComponent) 
            },
            { 
                path: 'projects/starred', 
                loadComponent: () => import('./pages/projects/starred/starred.component').then(m => m.StarredComponent) 
            },
            { 
                path: 'notes/all-notes', 
                loadComponent: () => import('./pages/notes/all-notes/all-notes.component').then(m => m.AllNotesComponent) 
            },
            { 
                path: 'notes/tags', 
                loadComponent: () => import('./pages/notes/tags/tags.component').then(m => m.TagsComponent) 
            },
            { 
                path: 'snippets/all-snippets', 
                loadComponent: () => import('./pages/snippets/all-snippets/all-snippets.component').then(m => m.AllSnippetsComponent) 
            }
        ]
    },
    {
        path: '**',
        redirectTo: ''
    }
];


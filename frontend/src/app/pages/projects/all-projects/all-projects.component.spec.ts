import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllProjectsComponent } from './all-projects.component';
import { provideRouter } from '@angular/router';

describe('AllProjectsComponent', () => {
  let component: AllProjectsComponent;
  let fixture: ComponentFixture<AllProjectsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllProjectsComponent],
      providers: [provideRouter([])]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllProjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

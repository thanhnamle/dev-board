import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllNotesComponent } from './all-notes.component';
import { provideRouter } from '@angular/router';

describe('AllNotesComponent', () => {
  let component: AllNotesComponent;
  let fixture: ComponentFixture<AllNotesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllNotesComponent],
      providers: [provideRouter([])]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllNotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

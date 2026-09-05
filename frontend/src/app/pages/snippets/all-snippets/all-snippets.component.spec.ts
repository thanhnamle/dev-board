import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllSnippetsComponent } from './all-snippets.component';
import { provideRouter } from '@angular/router';

describe('AllSnippetsComponent', () => {
  let component: AllSnippetsComponent;
  let fixture: ComponentFixture<AllSnippetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllSnippetsComponent],
      providers: [provideRouter([])]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllSnippetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

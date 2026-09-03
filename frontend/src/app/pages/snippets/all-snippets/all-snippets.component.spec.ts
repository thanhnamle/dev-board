import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllSnippetsComponent } from './all-snippets.component';

describe('AllSnippetsComponent', () => {
  let component: AllSnippetsComponent;
  let fixture: ComponentFixture<AllSnippetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllSnippetsComponent]
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

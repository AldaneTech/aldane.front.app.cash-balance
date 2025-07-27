import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LayoutComponent } from './layout.component';
import { RouterTestingModule } from '@angular/router/testing'; // ✅ IMPORTA ESTO

describe('LayoutComponent', () => {
  let component: LayoutComponent;
  let fixture: ComponentFixture<LayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LayoutComponent],
      imports: [RouterTestingModule], // ✅ AÑADE ESTO
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
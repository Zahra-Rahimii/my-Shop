import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputMask } from 'primeng/inputmask';


@Component({
  selector: 'app-testprimeng',
  imports: [InputMask,FormsModule],
  templateUrl: './testprimeng.component.html',
  styleUrl: './testprimeng.component.css'
})
export class TestprimengComponent {
  phone:string = '';
  phoneValid: boolean = true;
validatePhone(){
  this.phoneValid = this.phone?.length ===14;
}
}

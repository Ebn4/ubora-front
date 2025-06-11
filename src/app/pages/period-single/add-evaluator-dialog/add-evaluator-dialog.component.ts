import {Component, inject, Output, signal} from '@angular/core';
import {Observable, of} from 'rxjs';
import {LdapUser} from '../../../models/ldap-user.model';
import {EvaluatorService} from '../../../services/evaluator.service';
import {UserService} from '../../../services/user.service';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Evaluator} from '../../../models/evaluator.model';
import {Period} from '../../../models/period';
import {MatInput} from '@angular/material/input';
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from '@angular/material/autocomplete';
import {AsyncPipe} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-add-evaluator-dialog',
  imports: [
    ReactiveFormsModule,
    MatInput,
    MatAutocompleteTrigger,
    MatAutocomplete,
    MatOption,
    AsyncPipe
  ],
  templateUrl: './add-evaluator-dialog.component.html',
  standalone: true,
  styles: ``
})
export class AddEvaluatorDialogComponent {
  readonly data = inject<{ periodId: number }>(MAT_DIALOG_DATA);
  evaluators = signal<Evaluator[]>([])
  error = signal<string | null>(null)
  users = signal<LdapUser[]>([])
  periods = signal<Period[]>([])
  filteredUsers: Observable<LdapUser[]> | undefined;
  readonly dialogRef = inject(MatDialogRef<AddEvaluatorDialogComponent>);

  @Output() successMessage = signal<string | null>(null)

  query = new FormControl('')
  form = new FormGroup({
    selectedUserCuid: new FormControl("", [Validators.required]),
    evaluatorType: new FormControl('SELECTION', [Validators.required])
  })

  evaluatorTypes = signal<{ name: string, type: string }[]>(
    [
      {
        name: 'Selection',
        type: 'SELECTION'
      }, {
      name: 'Preselection',
      type: 'PRESELECTION'
    }
    ]
  )

  evaluatorService = inject(EvaluatorService)
  userServices = inject(UserService)

  ngOnInit() {
    this.query.valueChanges.subscribe(value => {
      this.onSearchUser(value ?? '')
    });
  }

  onClose(){
    this.dialogRef.close()
  }

  onSearchUser(query: string) {
    this.userServices.searchUserFromLdap(query).subscribe({
      next: value => {
        this.users.set(value.data)
        this.filteredUsers = of(value.data)
      },
      error: err => {
        console.log(err)
      }
    })
  }

  onSubmit() {
    if (this.form.invalid) {
      return;
    }

    const formData = this.form.value
    this.evaluatorService.addEvaluator({
      periodId: this.data.periodId,
      type: formData.evaluatorType ?? '',
      cuid: formData.selectedUserCuid ?? ''
    }).subscribe({
      next: value => {
        this.successMessage.set("L'ajout de l'evaluateur s'effectuer avec succès")
        this.dialogRef.close()
      },
      error: err => {
        console.log(err)
      }
    })
  }

  displayFn(user: LdapUser): string {
    return user && user.name ? user.name : '';
  }

  onSelectedUser(user: LdapUser) {
    this.form.patchValue({
      selectedUserCuid: user.cuid
    })
  }
}

import {ChangeDetectionStrategy, Component, EventEmitter, inject, Output} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions, MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import {UserService} from '../../../services/user.service';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-delete-user-dialog',
  templateUrl: './delete-user-dialog.component.html',
  styles: ``,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatDialogClose
  ]
})
export class DeleteUserDialogComponent {

  userService = inject(UserService)
  readonly snackbar = inject(MatSnackBar)
  readonly dialogRef = inject(MatDialogRef<DeleteUserDialogComponent>);
  readonly data = inject<{ userId: number }>(MAT_DIALOG_DATA);

  onDeleteUser() {
    this.userService.deleteUser(this.data.userId)
      .subscribe({
        next: value => {
          this.snackbar.open("Suppression de l'utilisateur effectuer avec succès", 'Fermer', {
            duration: 3000,
          });
        }, error: err => {
          console.error(err)
        }
      })
  }
}

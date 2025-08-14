import {Component, inject, signal} from '@angular/core';
import { NgForOf, NgClass } from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BaseListWidget} from '../../widgets/base-list-widget';
import {User} from '../../models/user.model';
import {UserService} from '../../services/user.service';
import {MatIcon} from '@angular/material/icon';
import {MatDialog} from '@angular/material/dialog';
import {DeleteUserDialogComponent} from './delete-user-dialog/delete-user-dialog.component';

@Component({
  selector: 'app-users',
  imports: [
    NgForOf,
    ReactiveFormsModule,
    FormsModule,
    MatIcon,
    NgClass
  ],
  templateUrl: './users.component.html',
  standalone: true,
  styles: ``
})
export class UsersComponent extends BaseListWidget {
  readonly dialog = inject(MatDialog);
  userService = inject(UserService)

  role = signal('')
  users = signal<User[]>([])

  ngOnInit() {
    this.loadData()
  }

  override loadData() {
    super.loadData();

    this.userService.getUsers(
      this.currentPage,
      this.per_page,
      this.search,
      this.role()
    )
      .subscribe({
        next: value => {
          this.users.set(value.data)
          this.currentPage = value.meta.current_page;
          this.lastPage = value.meta.last_page;
          console.log(value)
        },
        error: err => {
          console.log(err)
        }
      })
  }

  onDeleteUser(userId: number) {
    const dialogRef = this.dialog.open(DeleteUserDialogComponent, {
      width: '250px',
      data: {userId: userId}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        this.loadData()
      }
    });
  }
}

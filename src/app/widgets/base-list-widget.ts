import { countPerPageList } from './../constantes/count_per_page_list';
import { Component } from "@angular/core";


@Component({
  template: '',
  imports: [],
  selector: 'app-base-list-widget',
})
export class BaseListWidget {
  countPerPageList = countPerPageList;
  per_page = this.countPerPageList[0].value;

  currentPage: number = 1;
  lastPage: number = 1;
  search: string = '';
  status: string = '';

  onSearchChange() {
    this.currentPage = 1;
    this.loadData();
  }

  paginationChange(){
    this.currentPage = 1;
    this.loadData();
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.lastPage) {
      this.currentPage=page
      this.loadData();
    }
  }

  loadData() {

  }

}

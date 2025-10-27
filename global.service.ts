import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GlobalService {
  /**
   * Các trang & menu đang được chọn trong ứng dụng.
   * Tương thích với logic $rootScope.PAGES trong AngularJS.
   */
  PAGES = {
    selectedFeature: '',
    selectedMenu: '',
    selectedConfigurationPage: '',
    FEATURE_CONFIGURATION: 'FeatureConfig',
    CONFIGURATION_MENU_GROUPSANDUSERS: 'GroupsUsersMenu',
    CONFIGURATION_GROUPSANDUSERS_GROUPS: 'GroupsPage',
    CONFIGURATION_GROUPSANDUSERS_TENANT: 'TenantPage',
  };

  /**
   * Lưu lịch sử điều hướng (breadcrumb)
   */
  history: Array<{ ui: string; name: string }> = [];

  /**
   * Multi-tenant flag (biến toàn cục)
   * - is_mt_enable$: BehaviorSubject<boolean> giúp component subscribe thay đổi
   * - is_mt_enable: giá trị hiện tại (getter/setter)
   */
  private _is_mt_enable = new BehaviorSubject<boolean>(false);
  is_mt_enable$ = this._is_mt_enable.asObservable();

  get is_mt_enable(): boolean {
    return this._is_mt_enable.value;
  }

  set is_mt_enable(val: boolean) {
    this._is_mt_enable.next(val);
  }

  /**
   * Hàm tiện ích reset lại trạng thái trang khi cần
   */
  resetPages(): void {
    this.PAGES.selectedFeature = '';
    this.PAGES.selectedMenu = '';
    this.PAGES.selectedConfigurationPage = '';
  }

  /**
   * Cập nhật page hiện tại (tương tự như trong ConfigurationService)
   */
  setActivePage(feature: string, menu: string, page: string): void {
    this.PAGES.selectedFeature = feature;
    this.PAGES.selectedMenu = menu;
    this.PAGES.selectedConfigurationPage = page;
  }
}

import { Injectable } from '@angular/core';

/**
 * Service tiện ích — chuyển từ AngularJS utilities
 * Cung cấp các hàm thao tác UI & xử lý mảng selection
 */
@Injectable({
  providedIn: 'root',
})
export class UtilitiesService {
  /**
   * Hiển thị hộp thoại confirm (tối giản, có callback)
   * - message: nội dung
   * - type: loại thông báo (1 = warning, v.v.)
   * - onOk, onCancel: callback khi người dùng chọn
   */
  displayConfirmDialog(
    title: string,
    message: string,
    type: number,
    onOk?: () => void,
    onCancel?: () => void
  ): void {
    const result = confirm(`${title}\n\n${message}`);
    if (result) {
      if (onOk) onOk();
    } else {
      if (onCancel) onCancel();
    }
  }

  /**
   * Hiển thị dialog lỗi đơn giản (alert fallback)
   */
  displaySingleErrorDialog(message: string): void {
    alert(message);
  }

  /**
   * Lấy danh sách dòng được chọn (toggle index)
   * @param currentSelected - mảng index đang được chọn
   * @param index - index người dùng click
   * @returns mảng mới sau khi toggle
   */
  getSelectedRows(currentSelected: number[], index: number): number[] {
    const exists = currentSelected.includes(index);
    if (exists) {
      return currentSelected.filter((i) => i !== index);
    } else {
      return [...currentSelected, index];
    }
  }
}

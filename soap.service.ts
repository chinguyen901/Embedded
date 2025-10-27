import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

/**
 * Service SOAP tương thích 100% với AngularJS soap_utils
 * - Giữ nguyên hành vi .then()
 * - Không thay đổi cấu trúc dữ liệu hoặc parsing
 */
@Injectable({
  providedIn: 'root'
})
export class SoapService {

  private baseUrl = '/soap'; // relative nếu backend cùng domain

  constructor(private http: HttpClient) {}

  /** Đọc dữ liệu (SOAP Read) */
  executeRead(xmlBody: string): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.baseUrl}/read`, xmlBody, {
        headers: { 'Content-Type': 'text/xml' },
        responseType: 'text'
      }).pipe(map(res => this.parseXml(res)))
    );
  }

  /** Xóa dữ liệu (SOAP Delete) */
  executeDelete(xmlBody: string): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.baseUrl}/delete`, xmlBody, {
        headers: { 'Content-Type': 'text/xml' },
        responseType: 'text'
      }).pipe(map(res => this.parseXml(res)))
    );
  }

  /** Kiểm tra unique (SOAP isUnique) */
  executeIsUnique(xml: string): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.baseUrl}/isUnique`, xml, {
        headers: { 'Content-Type': 'text/xml' },
        responseType: 'text'
      }).pipe(map(res => this.parseXml(res)))
    );
  }

  /** Commit tạo/sửa dữ liệu (SOAP Commit) */
  executeCommit(xml: string): Promise<any> {
    return firstValueFrom(
      this.http.post(`${this.baseUrl}/commit`, xml, {
        headers: { 'Content-Type': 'text/xml' },
        responseType: 'text'
      }).pipe(map(res => this.parseXml(res)))
    );
  }

  /** Chuyển XML string → JSON object */
  private parseXml(xmlStr: string): any {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlStr, 'text/xml');
    return this.xmlToJson(xml);
  }

  /** Đệ quy chuyển XML DOM → JS Object */
  private xmlToJson(xml: any): any {
    let obj: any = {};

    if (xml.nodeType === 1) { // Element
      if (xml.attributes?.length > 0) {
        obj['@attributes'] = {};
        for (let j = 0; j < xml.attributes.length; j++) {
          const attribute = xml.attributes.item(j);
          obj['@attributes'][attribute.nodeName] = attribute.nodeValue;
        }
      }
    } else if (xml.nodeType === 3) { // Text
      obj = xml.nodeValue;
    }

    if (xml.hasChildNodes()) {
      for (let i = 0; i < xml.childNodes.length; i++) {
        const item = xml.childNodes.item(i);
        const nodeName = item.nodeName;
        if (typeof obj[nodeName] === 'undefined') {
          obj[nodeName] = this.xmlToJson(item);
        } else {
          if (!Array.isArray(obj[nodeName])) {
            obj[nodeName] = [obj[nodeName]];
          }
          obj[nodeName].push(this.xmlToJson(item));
        }
      }
    }
    return obj;
  }
}

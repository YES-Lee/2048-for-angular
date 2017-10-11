import { Component, Input, OnInit, HostListener, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { Http } from '@angular/http';
import { HttpClient, HttpParams } from '@angular/common/http';
import 'rxjs/add/operator/map'; // 引入map操作符 (可选)
import { AppService } from './app.service';
import { NumberItem, Position } from './model';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css']
})
export class AppComponent implements OnInit {

  @ViewChild('messageBox') messageBox: ElementRef;

  isShowMsg = false;
  msgContent: string;

  showArray: Array<Array<NumberItem>> = [[]];
  /**
   * 游戏状态
   * code: -1, meaning: lose
   * code: 0, meaning: gaming
   * code: -1, meaning: win
   */
  gameStatus = 0;
  // gameMatrix = [
  //   [0, 0, 0, 0],
  //   [0, 0, 0, 0],
  //   [0, 0, 0, 0],
  //   [0, 0, 0, 0]
  // ];
  gameScore = 0;

  constructor(
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.initGameData();
    setTimeout(() => {
    this.setNotNew();
    }, 500);
  }

  /**
   * 初始化数据
   */
  initGameData() {
    for (let row = 0; row < 4; row ++) {
      const r: Array<NumberItem> = [];
      for (let col = 0; col < 4; col ++) {
        r.push(new NumberItem(0, false));
      }
      this.showArray[row] = r;
    }
    this.log(this.showArray);
    const po1 = this.generateRandomNumber();
    const po2 = this.generateRandomNumber();
    this.showArray[po1.row][po1.column].value = po1.value;
    this.showArray[po1.row][po1.column].isNew = true;
    this.showArray[po2.row][po2.column].value = po2.value;
    this.showArray[po2.row][po2.column].isNew = true;
    this.gameStatus = 0;
    this.gameScore = 0;
  }

  private showMsg(msg: string) {
    this.msgContent = msg;
    this.isShowMsg = true;
  }

  private hideMsg($event: Event) {
    $event.stopPropagation();
    this.isShowMsg = false;
  }

  /**
   * 每次操作新增1-2个数字
   * @param arr 矩阵
   */
  private addNumber(arr: Array<Array<NumberItem>>): Array<Array<NumberItem>> {
    this.log('addNumber');
    if (this.isFull(arr)) {
      this.log('matrix is full!');
      return arr;
    }
    const po1 = this.generateRandomNumber();
    // const po2 = this.generateRandomNumber();
    if (arr[po1.row][po1.column].value !== 0) {
      return this.addNumber(arr); // 改个位置都不为0则重新操作
    } else {
      if (arr[po1.row][po1.column].value === 0) {
        arr[po1.row][po1.column].value = po1.value;
        arr[po1.row][po1.column].isNew = true;
      }
      return arr;
    }
  }

  /**
   * 随机生成数字2/4
   */
  private generateRandomNumber(): Position {
    // 模拟0.2的概率出现2, 0.8的概率出息4
    const value = Math.round(Math.random() * 9) > 7 ? 4 : 2;
    return new Position(
      Math.round(Math.random() * 3),
      Math.round(Math.random() * 3),
      value
    );
  }

  /**
   * 判断矩阵是否填满
   * @param arr 矩阵
   */
  private isFull(arr: Array<Array<NumberItem>>): boolean {
    for (const rows of arr) {
      for (const item of rows) {
        if (item.value === 0) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * 键盘事件
   * @param  $event
   */
  @HostListener('window:keyup', ['$event'])
  moveTo($event: KeyboardEvent) {
    if (this.gameStatus !== -1) {
      switch ($event.keyCode) {
        case 37: this.showArray = this.moveLeftOrRight(this.showArray, 'left');
          break;
        case 38: this.showArray = this.moveUpOrDown(this.showArray, 'up');
          break;
        case 39: this.showArray = this.moveLeftOrRight(this.showArray, 'right');
          break;
        case 40: this.showArray = this.moveUpOrDown(this.showArray, 'down');
          break;
        default:
          break;
      }
      setTimeout(() => {
        this.setNotNew();
        }, 500);
      this.checkStatus(this.showArray);
    } else {
      return;
    }
  }

  /**
   * 上/下 操作
   * @param arr 矩阵
   * @param type up/down
   */
  private moveUpOrDown(arr: Array<Array<NumberItem>>, type: string): Array<Array<NumberItem>> {
    this.log('up');
    const backUpArr = this.deepCopyArray(arr);
    this.log(type);
    // return this.addNumber(this.moveRow(this.mergeRow(this.moveRow(arr, 'up'), 'up'), 'up'));
    arr = this.moveRow(this.mergeRow(this.moveRow(arr, type), type), type);
    const isChanged = this.compareArray(backUpArr, arr);
    if (isChanged) {
      return arr;
    } else {
      return this.addNumber(arr);
    }
  }

  /**
   * 左/右 操作
   * @param arr 矩阵
   * @param type left/right
   */
  private moveLeftOrRight(arr: Array<Array<NumberItem>>, type: string): Array<Array<NumberItem>> {
    this.log('up');
    const backUpArr = this.deepCopyArray(arr);
    this.log(type);
    arr = this.moveCol(this.mergeCol(this.moveCol(arr, type), type), type);
    if (this.compareArray(backUpArr, arr)) {
      return arr;
    } else {
      return this.addNumber(arr);
    }
  }

  /**
   * 将所有行移动到一起
   * @param arr 矩阵
   * @param type up/down
   * @param currentStep 不传
   */
  private moveRow(arr: Array<Array<NumberItem>>, type: string, currentStep: number = 1): Array<Array<NumberItem>> {
    const rowsLangth = arr.length;
    if (currentStep === rowsLangth) {
      return arr;
    }
    let step = 1;
    switch (type) {
      case 'up': step = -1;
        break;
      case 'down': step = 1;
        break;
    }
    // tslint:disable-next-line:forin
    for (const row in arr) {
      for (const col in arr[row]) {
        if (arr.hasOwnProperty(+row + step)) {
          const lastRow: number = +row + step;
          const currentRow: number = +row;
          if (arr[lastRow][col].value === 0) {
            arr[lastRow][col].value = arr[currentRow][col].value;
            arr[currentRow][col].value = 0;
          }
        }
      }
    }
    this.moveRow(arr, type, currentStep + 1);
    return arr;
  }

  /**
   * 行相加
   * @param arr 矩阵
   * @param type up/down
   * @param currentStep 不传
   */
  private mergeRow(arr: Array<Array<NumberItem>>, type: string, currentStep: number = 1): Array<Array<NumberItem>> {
    this.log('mergeRow');
    const rowsLangth = arr.length;
    if (currentStep === rowsLangth) {
      return arr;
    }
    let step = 1;
    switch (type) {
      case 'up': {
        // tslint:disable-next-line:forin
        for (const row in arr) {
          for (const col in arr[row]) {
            if (arr.hasOwnProperty(+row + step)) {
              const nextRow: number = +row + step;
              const currentRow: number = +row;
              if (arr[nextRow][col].value === 0 || arr[nextRow][col].value === arr[currentRow][col].value) {
                arr[currentRow][col].value += arr[nextRow][col].value;
                if (arr[nextRow][col].value !== 0) { // 计入分数
                  this.gameScore += arr[currentRow][col].value;
                }
                arr[nextRow][col].value = 0;
              }
            }
          }
        }
        break;
      }
      case 'down': {
        step = -1;
        // tslint:disable-next-line:forin
        for (const row in arr) {
          for (const col in arr[row]) {
            if (arr.hasOwnProperty(rowsLangth - 1 - +row + step)) {
              const nextRow: number = rowsLangth - 1 - +row + step;
              const currentRow: number = rowsLangth - 1 - +row;
              if (arr[nextRow][col].value === 0 || arr[nextRow][col].value === arr[currentRow][col].value) {
                arr[currentRow][col].value += arr[nextRow][col].value;
                if (arr[nextRow][col].value !== 0) { // 计入分数
                  this.gameScore += arr[currentRow][col].value;
                }
                arr[nextRow][col].value = 0;
              }
            }
          }
        }
        break;
      }
    }
    // // tslint:disable-next-line:forin
    // for (const row in arr) {
    //   for (const col in arr[row]) {
    //     if (arr.hasOwnProperty(+row + step)) {
    //       const nextRow: number = +row + step;
    //       const currentRow: number = +row;
    //       if (arr[nextRow][col] === 0 || arr[nextRow][col] === arr[currentRow][col]) {
    //         arr[currentRow][col] += arr[nextRow][col];
    //         arr[nextRow][col] = 0;
    //       }
    //     }
    //   }
    // }
    // this.mergeRow(arr, type, currentStep + 1);
    return arr;
  }

  /**
   * 将所有列移动到一起
   * @param arr 矩阵
   * @param type left/right
   * @param currentStep 不传
   */
  private moveCol(arr: Array<Array<NumberItem>>, type: string, currentStep: number = 1): Array<Array<NumberItem>> {
    const colLangth = arr[0].length;
    if (currentStep === colLangth) {
      return arr;
    }
    let step = 1;
    switch (type) {
      case 'left': step = -1;
        break;
      case 'right': step = 1;
        break;
    }
    // tslint:disable-next-line:forin
    for (const row in arr) {
      for (const col in arr[row]) {
        if (arr[row].hasOwnProperty(+col + step)) {
          const lastCol: number = +col + step;
          const currentCol: number = +col;
          if (arr[row][lastCol].value === 0) {
            arr[row][lastCol].value = arr[row][currentCol].value;
            arr[row][currentCol].value = 0;
          }
        }
      }
    }
    this.moveCol(arr, type, currentStep + 1);
    return arr;
  }

  /**
   * 列相加
   * @param arr 矩阵
   * @param type left/right
   * @param currentStep 不传
   */
  private mergeCol(arr: Array<Array<NumberItem>>, type: string, currentStep: number = 1): Array<Array<NumberItem>> {
    this.log('mergeCol');
    const colLangth = arr[0].length;
    if (currentStep === colLangth) {
      return arr;
    }
    let step = 1;
    switch (type) {
      case 'left': {
        // tslint:disable-next-line:forin
        for (const row in arr) {
          for (const col in arr[row]) {
            if (arr[row].hasOwnProperty(+col + step)) {
              const nextCol: number = +col + step;
              const currentCol: number = +col;
              if (arr[row][nextCol].value === 0 || arr[row][nextCol].value === arr[row][currentCol].value) {
                arr[row][currentCol].value += arr[row][nextCol].value;
                if (arr[row][nextCol].value !== 0) { // 计入分数
                  this.gameScore += arr[row][currentCol].value;
                }
                arr[row][nextCol].value = 0;
              }
            }
          }
        }
        break;
      }
      case 'right': {
        step = -1;
        // tslint:disable-next-line:forin
        for (const row in arr) {
          for (const col in arr[row]) {
            if (arr[row].hasOwnProperty(colLangth - 1 - +col + step)) {
              const nextCol: number = colLangth - 1 - +col + step;
              const currentCol: number = colLangth - 1 - +col;
              if (arr[row][nextCol].value === 0 || arr[row][nextCol] === arr[row][currentCol]) {
                arr[row][currentCol].value += arr[row][nextCol].value;
                if (arr[row][nextCol].value !== 0) { // 计入分数
                  this.gameScore += arr[row][currentCol].value;
                }
                arr[row][nextCol].value = 0;
              }
            }
          }
        }
        break;
      }
    }
    // // tslint:disable-next-line:forin
    // for (const row in arr) {
    //   for (const col in arr[row]) {
    //     if (arr[row].hasOwnProperty(+col + step)) {
    //       const nextCol: number = +col + step;
    //       const currentCol: number = +col;
    //       if (arr[row][nextCol] === 0 || arr[row][nextCol] === arr[row][currentCol]) {
    //         arr[row][currentCol] += arr[row][nextCol];
    //         arr[row][nextCol] = 0;
    //       }
    //     }
    //   }
    // }
    // this.mergeCol(arr, type, currentStep + 1);
    return arr;
  }

  /**
   * 检查输赢
   * @param arr 矩阵
   */
  private checkStatus(arr: Array<Array<NumberItem>>) {
    const newArr = this.deepCopyArray(arr);
    this.log('检查输赢');
    this.checkLose(arr);
    this.checkWin(arr);
  }

  /**
   * 检查是否输
   * @param arr 矩阵
   */
  private checkLose(arr: Array<Array<NumberItem>>): boolean {
    let isLose = false;
    if (this.isFull(arr)) {
      // tslint:disable-next-line:forin
      for (const row in arr) {
        for (const col in arr[row]) {
          if (arr.hasOwnProperty(+row + 1)) {
            isLose = (arr[row][col].value !== arr[+row + 1][col].value);
            if (!isLose) {
              return false;
            }
          }
        }
      }
      // tslint:disable-next-line:forin
      for (const row in arr) {
        for (const col in arr[row]) {
          if (arr[row].hasOwnProperty(+col + 1)) {
            isLose = (arr[row][col].value !== arr[row][+col + 1].value);
            if (!isLose) {
              return false;
            }
          }
        }
      }
      this.gameStatus = -1;
      setTimeout(() => {
        this.gameAlert('game over');
      }, 100);
      return true;
    }
  }

  /**
   * 检查是否赢
   * @param arr 矩阵
   */
  private checkWin(arr: Array<Array<NumberItem>>) {
    for (const row of arr) {
      for (const item of row) {
        if (item.value === 2048 && this.gameStatus === 0) {
          this.gameStatus = 1;
          setTimeout(() => {
            this.gameAlert('you win!');
          }, 100);
        }
      }
    }
  }

  private setNotNew() {
    for (const rows of this.showArray) {
      for (const item of rows) {
        item.isNew = false;
      }
    }
  }

  /**
   * 控制颜色
   * @param item item
   */
  gridCellStyle(item: number) {
    let fontsize = '3em';
    if (item >= 1024) {
      fontsize = '2em';
      if (item >= 16348) {
        fontsize = '1.5em';
      }
    }
    switch (item) {
      case 2: return { 'background-color': '#ffd180', 'font-size': fontsize };
      case 4: return { 'background-color': '#ffab40', 'font-size': fontsize };
      case 8: return { 'color': '#fff', 'background-color': '#ff9100', 'font-size': fontsize };
      case 16: return { 'color': '#fff', 'background-color': '#ff6d00', 'font-size': fontsize };
      case 32: return { 'color': '#fff', 'background-color': '#ffab91', 'font-size': fontsize };
      case 64: return { 'color': '#fff', 'background-color': '#ff8a65', 'font-size': fontsize };
      case 128: return { 'color': '#fff', 'background-color': '#ff7043', 'font-size': fontsize };
      case 256: return { 'color': '#fff', 'background-color': '#ff5722', 'font-size': fontsize };
      case 512: return { 'color': '#fff', 'background-color': '#f4511e', 'font-size': fontsize };
      case 1024: return { 'color': '#fff', 'background-color': '#e64a19', 'font-size': fontsize };
      case 2048: return { 'color': '#fff', 'background-color': '#d84315', 'font-size': fontsize };
      case 4096: return { 'color': '#fff', 'background-color': '#bf360c', 'font-size': fontsize };
      case 8192: return { 'color': '#fff', 'background-color': '#dd2c00', 'font-size': fontsize };
      case 16384: return { 'color': '#fff', 'background-color': '#dd2c00', 'font-size': fontsize };
    }
  }

  /*****utils*******************************************************************************/
  /**
   * 比较矩阵
   */
  private compareArray(arr1: Array<Array<NumberItem>>, arr2: Array<Array<NumberItem>>): boolean {
    this.log('compareArray');
    this.log(arr1);
    this.log(arr2);

    if (arr1.length !== arr2.length) {
      this.log(false);
      return false;
    }
    // tslint:disable-next-line:forin
    for (const row in arr1) {
      // tslint:disable-next-line:forin
      for (const col in arr1[row]) {
        if (arr1[row][col].value !== arr2[row][col].value) {
          this.log(false);
          return false;
        }
      }
    }
    this.log(true);
    return true;
  }

  /**
   * 深度复制矩阵
   * @param from 源矩阵
   */
  private deepCopyArray(from: Array<Array<NumberItem>>) {
    this.log('deepCopyArray');
    // tslint:disable-next-line:forin
    // const to = [[]];
    // for (const row in from) {
    //   // tslint:disable-next-line:forin
    //   for (const col in from[row]) {
    //     to[row][col] += from[row][col];
    //   }
    // }
    return from.map(items => {
      return items.map(item => {
        return new NumberItem(item.value, false);
      });
    });
  }

  /**
   * 游戏弹窗
   * @param msg 消息内容
   */
  private gameAlert(msg: string) {
    this.showMsg(msg);
  }

  /**
   * 自定义打印日志工具
   * @param isShow 是否打印
   * @param content 打印内容
   */
  private log(content: any): void {
    const isShow = true;
    if (isShow) {
      console.log(content);
    } else {
      return;
    }
  }
  /*****utils*******************************************************************************/
}


import { Component, Input, OnInit, HostListener } from '@angular/core';
import { Http } from '@angular/http';
import { HttpClient, HttpParams } from '@angular/common/http';
import 'rxjs/add/operator/map'; // 引入map操作符 (可选)
import { AppService } from './app.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css']
})
export class AppComponent implements OnInit {

  showArray: number[][];
  /**
   * 游戏状态
   * code: -1, meaning: lose
   * code: 0, meaning: gaming
   * code: -1, meaning: win
   */
  gameStatus = 0;
  gameMatrix = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ];
  gameScore = 0;
  ngOnInit(): void {
    this.initGameData();
  }

  /**
   * 初始化数据
   */
  private initGameData() {
    this.showArray = this.deepCopyArray(this.gameMatrix);
    const po1 = this.generateRandomNumber();
    const po2 = this.generateRandomNumber();
    this.showArray[po1.row][po1.column] = po1.value;
    this.showArray[po2.row][po2.column] = po2.value;
    this.gameStatus = 0;
  }

  /**
   * 每次操作新增1-2个数字
   * @param arr 矩阵
   */
  private addNumber(arr: Array<Array<number>>): Array<Array<number>> {
    this.log('addNumber');
    if (this.isFull(arr)) {
      this.log('matrix is full!');
      return arr;
    }
    const po1 = this.generateRandomNumber();
    // const po2 = this.generateRandomNumber();
    if (arr[po1.row][po1.column] !== 0) {
      return this.addNumber(arr); // 改个位置都不为0则重新操作
    } else {
      if (arr[po1.row][po1.column] === 0) {
        arr[po1.row][po1.column] = po1.value;
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
  private isFull(arr: Array<Array<number>>): boolean {
    for (const rows of arr) {
      for (const item of rows) {
        if (item === 0) {
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
  private moveUpOrDown(arr: Array<Array<number>>, type: string): Array<Array<number>> {
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
  private moveLeftOrRight(arr: Array<Array<number>>, type: string): Array<Array<number>> {
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
  private moveRow(arr: Array<Array<number>>, type: string, currentStep: number = 1): Array<Array<number>> {
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
          if (arr[lastRow][col] === 0) {
            arr[lastRow][col] = arr[currentRow][col];
            arr[currentRow][col] = 0;
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
  private mergeRow(arr: Array<Array<number>>, type: string, currentStep: number = 1): Array<Array<number>> {
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
              if (arr[nextRow][col] === 0 || arr[nextRow][col] === arr[currentRow][col]) {
                arr[currentRow][col] += arr[nextRow][col];
                if (arr[nextRow][col] !== 0) { // 计入分数
                  this.gameScore += arr[currentRow][col];
                }
                arr[nextRow][col] = 0;
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
              if (arr[nextRow][col] === 0 || arr[nextRow][col] === arr[currentRow][col]) {
                arr[currentRow][col] += arr[nextRow][col];
                if (arr[nextRow][col] !== 0) { // 计入分数
                  this.gameScore += arr[currentRow][col];
                }
                arr[nextRow][col] = 0;
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
  private moveCol(arr: Array<Array<number>>, type: string, currentStep: number = 1): Array<Array<number>> {
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
          if (arr[row][lastCol] === 0) {
            arr[row][lastCol] = arr[row][currentCol];
            arr[row][currentCol] = 0;
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
  private mergeCol(arr: Array<Array<number>>, type: string, currentStep: number = 1): Array<Array<number>> {
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
              if (arr[row][nextCol] === 0 || arr[row][nextCol] === arr[row][currentCol]) {
                arr[row][currentCol] += arr[row][nextCol];
                if (arr[row][nextCol] !== 0) { // 计入分数
                  this.gameScore += arr[row][currentCol];
                }
                arr[row][nextCol] = 0;
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
              if (arr[row][nextCol] === 0 || arr[row][nextCol] === arr[row][currentCol]) {
                arr[row][currentCol] += arr[row][nextCol];
                if (arr[row][nextCol] !== 0) { // 计入分数
                  this.gameScore += arr[row][currentCol];
                }
                arr[row][nextCol] = 0;
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
  private checkStatus(arr: Array<Array<number>>) {
    const newArr = this.deepCopyArray(arr);
    this.log('检查输赢');
    this.checkLose(arr);
    this.checkWin(arr);
  }

  /**
   * 检查是否输
   * @param arr 矩阵
   */
  private checkLose(arr: Array<Array<number>>): boolean {
    let isLose = false;
    if (this.isFull(arr)) {
      // tslint:disable-next-line:forin
      for (const row in arr) {
        for (const col in arr[row]) {
          if (arr.hasOwnProperty(+row + 1)) {
            isLose = (arr[row][col] !== arr[+row + 1][col]);
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
            isLose = (arr[row][col] !== arr[row][+col + 1]);
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
  private checkWin(arr: Array<Array<number>>) {
    for (const row of arr) {
      for (const item of row) {
        if (item === 2048 && this.gameStatus === 0) {
          this.gameStatus = 1;
          setTimeout(() => {
            this.gameAlert('you win!');
          }, 100);
        }
      }
    }
  }

  gridCellStyle(item: number) {
    switch (item) {
      case 2: return { 'background-color': '#ffd180' };
      case 4: return { 'background-color': '#ffab40' };
      case 8: return { 'color': '#fff', 'background-color': '#ff9100' };
      case 16: return { 'color': '#fff', 'background-color': '#ff6d00' };
      case 32: return { 'color': '#fff', 'background-color': '#ffab91' };
      case 64: return { 'color': '#fff', 'background-color': '#ff8a65' };
      case 128: return { 'color': '#fff', 'background-color': '#ff7043' };
      case 256: return { 'color': '#fff', 'background-color': '#ff5722' };
      case 512: return { 'color': '#fff', 'background-color': '#f4511e' };
      case 1024: return { 'color': '#fff', 'background-color': '#e64a19' };
      case 2048: return { 'color': '#fff', 'background-color': '#d84315' };
      case 4096: return { 'color': '#fff', 'background-color': '#bf360c' };
      case 8192: return { 'color': '#fff', 'background-color': '#dd2c00' };
      case 16384: return { 'color': '#fff', 'background-color': '#dd2c00' };
    }
  }

  /*****utils*******************************************************************************/
  /**
   * 比较矩阵
   */
  private compareArray(arr1: Array<Array<number>>, arr2: Array<Array<number>>): boolean {
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
        if (arr1[row][col] !== arr2[row][col]) {
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
  private deepCopyArray(from: Array<Array<number>>) {
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
        return item;
      });
    });
  }

  /**
   * 游戏弹窗
   * @param msg 消息内容
   */
  private gameAlert(msg: string) {
    alert(msg);
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
export class Position {
  row: number;
  column: number;
  value: number;

  constructor(row, col, value) {
    this.row = row;
    this.column = col;
    this.value = value;
  }
}

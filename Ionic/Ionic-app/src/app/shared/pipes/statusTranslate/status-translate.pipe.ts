import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'statusTranslatePipes'
})
export class StatusTranslatePipesPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}


    this.stack = {};
    this.count = 0;


  function push(element) {
    this.stack[this.count] = element;
    this.count++;
    return this.stack;
  }

  function pop() {
    this.count--;
    const element = this.stack[this.count];
    delete this.stack[this.count];
    return element;
  }

  function peek() {
    return this.stack[this.count - 1];
  }

  function size() {
    return this.count;
  }

  function clear(){
    this.stack = {};
    this.count = 0;
  }

  function print() {
    console.log(this.stack);
  }

  onmessage = function(e) {
    switch (e.data[0]) {
      case 'push':
        push(e.data[1]);
        break;
      case 'pop':
        var element = pop();
        postMessage(element);
        break;
      case 'clear':
        clear();
        break;
      default:
        break;
    }
  }



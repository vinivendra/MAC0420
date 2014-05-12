#include"stdio.h"


int main() {
  
  char a;

  while(scanf("%c", &a) != EOF) {
    if (a == '\n') {
      printf("\\n");
    }
    else {
      printf("%c", a);
    }
  }

  return 0;

} 

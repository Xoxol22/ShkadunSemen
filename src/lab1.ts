export interface User {
    id: number;
    name: string;
    email?: string;
    isActive: boolean;
  }
  
  export function createUser(
    id: number,
    name: string,
    email?: string,
    isActive: boolean = true
  ): User {
    return email !== undefined
      ? {
          id,
          name,
          email,
          isActive,
        }
      : {
          id,
          name,
          isActive,
        };
  }
  
  const user1 = createUser(1, "АНДРЮХА");
  const user2 = createUser(2, "Бобик", "bobik@example.com", false);
  
  
  export type Genre = "fiction" | "non-fiction";
  
  export interface Book {
    title: string;
    author: string;
    year?: number;
    genre: Genre;
  }
  
  export function createBook(book: Book): Book {
    return book;
  }
  
  // Примеры:
  const book1 = createBook({
    title: "The Hobbit",
    author: "J. R. R. Tolkien",
    genre: "fiction",
  });
  
  const book2 = createBook({
    title: "Clean Code",
    author: "Robert C. Martin",
    year: 2008,
    genre: "non-fiction",
  });
  
  // calculateArea с перегрузкой
  
  export function calculateArea(shape: "circle", radius: number): number;
  export function calculateArea(shape: "square", side: number): number;
  
  // реализация
  export function calculateArea(shape: "circle" | "square", size: number): number {
    if (shape === "circle") {
      return Math.PI * size * size;
    }
    return size * size;
  }
  
  // Примеры:
  const circleArea = calculateArea("circle", 5);
  const squareArea = calculateArea("square", 4);
  
  // Status и функция getStatusColor
  
  export type Status = "active" | "inactive" | "new";
  
  export function getStatusColor(status: Status): string {
    switch (status) {
      case "active":
        return "green";
      case "inactive":
        return "gray";
      case "new":
        return "blue";
      default:
        const _exhaustiveCheck: never = status;
        return _exhaustiveCheck;
    }
  }
  
  // Примеры:
  const colorActive = getStatusColor("active");
  const colorNew = getStatusColor("new");
  
  // StringFormatter и две функции
  
  export type StringFormatter = (input: string, uppercase?: boolean) => string;
  
  export const capitalizeFirst: StringFormatter = (input, uppercase = false) => {
    if (!input) return "";
    const trimmed = input;
    let result =
      trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    if (uppercase) {
      result = result.toUpperCase();
    }
    return result;
  };
  
  export const trimAndFormat: StringFormatter = (input, uppercase = false) => {
    let result = input.trim();
    if (uppercase) {
      result = result.toUpperCase();
    }
    return result;
  };
  
  const s1 = capitalizeFirst("hello");
  const s2 = trimAndFormat("   hello world   ");
  const s3 = trimAndFormat("   hello world   ", true);
  
  // Обобщённая функция getFirstElement
  
  export function getFirstElement<T>(arr: T[]): T | undefined {
    return arr.length > 0 ? arr[0] : undefined;
  }
  
  // Примеры:
  const nums = [67, 2, 3];
  const strs = ["d", "b", "c"];
  
  const firstNum = getFirstElement(nums); 
  const firstStr = getFirstElement(strs); 
  
  // Интерфейс HasId и универсальная функция findById
  
  export interface HasId {
    id: number;
  }
  
  export function findById<T extends HasId>(items: T[], id: number): T | undefined {
    for (const item of items) {
      if (item.id === id) return item;
    }
    return undefined;
  }
  
  // Примеры:
  const usersWithId: Array<User & HasId> = [
    { id: 1, name: "Alice", isActive: true },
    { id: 2, name: "Bob", isActive: false },
  ];
  
  const foundUser = findById(usersWithId, 2);
  
  // Вывод в консольку
  console.log("user1:", user1);
  console.log("user2:", user2);
  console.log("book1:", book1);
  console.log("book2:", book2);
  console.log("circleArea:", circleArea);
  console.log("squareArea:", squareArea);
  console.log("colorActive:", colorActive);
  console.log("colorNew:", colorNew);
  console.log("s1:", s1);
  console.log("s2:", s2);
  console.log("s3:", s3);
  console.log("firstNum:", firstNum);
  console.log("firstStr:", firstStr);
  console.log("foundUser:", foundUser);
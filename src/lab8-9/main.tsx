// Точка входа React: монтирует компонент лабораторной в #root.
import React from "react"
import { createRoot } from "react-dom/client"
import Lab8_9 from "./lab8-9"

const root = document.getElementById("root")

if (!root) {
  throw new Error("Элемент #root не найден")
}

createRoot(root).render(
  <React.StrictMode>
    <Lab8_9 />
  </React.StrictMode>,
)


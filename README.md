# PokeOracle: Simulador Predictivo para Randomlockes 🎮🔮

¡Bienvenido a **PokeOracle**! Este es un proyecto desarrollado para la asignatura de **Arquitectura de Software**. Consiste en un simulador web de combates individuales de Pokémon, diseñado específicamente como una herramienta de soporte analítico para jugadores de retos *Randomlocke*.

La aplicación cuenta con un motor de Inteligencia Artificial (inspirado en la lógica predictiva de los motores de ajedrez) que analiza el estado actual del combate para calcular probabilísticamente la mejor jugada posible mediante el algoritmo **Expectiminimax**, minimizando riesgos en escenarios de alta incertidumbre.

---

## 🚀 Características Principales

* **Motor de IA Integrado (Expectiminimax):** Algoritmo de búsqueda probabilística con profundidad 3 que evalúa árboles de decisión para sugerir la acción óptima (atacar o cambiar) en tiempo real.
* **Soporte Randomlocke:** Capacidad de procesar movimientos, habilidades y objetos asignados de forma completamente aleatoria a las entidades Pokémon.
* **Patrón Strategy de Daño:** Desacoplamiento total de las fórmulas matemáticas de combate para permitir la inyección de diferentes reglas o heurísticas sin alterar el núcleo del sistema.
* **Clean Architecture (Monorepo):** Sistema dividido en un Backend robusto de 4 capas y un Frontend moderno, garantizando un desacoplamiento total entre la lógica del juego y la interfaz de usuario.

---

## 🏗️ Estructura del Proyecto (Monorepo Cliente-Servidor)

El sistema está organizado en una solución monolítica de desarrollo que contiene dos entornos independientes:

* **`PokeOracle-Backend/` (Servidor):** Desarrollado en **.NET 8 (C#)**. Implementa **Clean Architecture** estructurado en 4 capas independientes (`Domain`, `Application`, `Infrastructure`, `WebApi`). Maneja las matemáticas de la IA, los DTOs, y la persistencia de datos mediante *Entity Framework In-Memory*.
* **`pokeoracle-assistant/` (Cliente):** Frontend web moderno desarrollado en **React, TypeScript y Vite**, enfocado en una experiencia de usuario rápida, fluida y consumiendo la API REST del servidor.

---

## 🛠️ Tecnologías Utilizadas

* **Backend:** C# 12, .NET 8, ASP.NET Core Web API, Entity Framework Core (In-Memory).
* **Frontend:** React 18, TypeScript, Vite, Node.js, Tailwind CSS.
* **Entornos de Desarrollo:** Visual Studio 2022 (Backend) y Visual Studio Code (Frontend).

---

## 🚀 Cómo Ejecutar el Proyecto Localmente

### 1. Inicializar la API del Backend

1. Navega a la carpeta `PokeOracle-Backend/`.
2. Abre la solución `PokeOracle.sln` en **Visual Studio 2022**.
3. Verifica que el proyecto `PokeOracle.WebApi` esté establecido como proyecto de inicio.
4. Presiona **F5** (o *Compilar > Iniciar depuración*). Se ejecutará el servidor y se abrirá la interfaz de Swagger (`https://localhost:XXXX`) en el navegador.

### 2. Inicializar la Interfaz Visual (Cliente)

1. Navega a la carpeta `pokeoracle-assistant/`.
2. Abre la carpeta en **Visual Studio Code**.
3. Abre una terminal integrada e instala las dependencias (solo la primera vez):

```bash
   npm install
```

4. Enciende el servidor de desarrollo:

```bash
   npm run dev
```

5. Abre el enlace local proporcionado (habitualmente `http://localhost:5173`) para interactuar con el simulador.

---

## 📑 Registro de Decisiones Arquitectónicas (ADR)

### ADR-04: Evolución a Clean Architecture y Monorepo Cliente-Servidor

| Campo | Valor |
|---|---|
| **Autor** | David Alonso Romero Medina |
| **Fecha** | 30/06/2026 |
| **Estado** | Aprobado |

#### Contexto

Inicialmente (ADR-01), el proyecto se concibió bajo el patrón MVC tradicional dentro de un único proyecto ASP.NET Core. Sin embargo, conforme el motor de IA (Expectiminimax) comenzó a requerir cálculos más complejos, inyección de dependencias para los algoritmos de daño (Patrón Strategy) y gestión de estado en memoria para el historial de turnos, el patrón MVC demostró ser insuficiente.

Los Controladores estaban asumiendo responsabilidades de lógica de negocio y la Vista (HTML/CSS clásico) limitaba la reactividad necesaria para una herramienta de soporte en tiempo real. Era imperativo refactorizar el proyecto para garantizar la mantenibilidad, aplicar los principios SOLID y cumplir con los estándares profesionales de la industria del software.

#### Decisión

Se ha decidido migrar la arquitectura del sistema hacia Clean Architecture para el Backend (C#) y adoptar un enfoque Cliente-Servidor integrando una SPA (Single Page Application) con React para el Frontend, unificando ambos en un Monorepo.

#### ¿Por qué?

Clean Architecture coloca el Dominio (las reglas puras de Pokémon y combate) en el centro del sistema, aislándolo completamente de frameworks, bases de datos o interfaces web.

* El **Dominio** ahora dicta las reglas.
* La **Aplicación** orquesta la IA y los DTOs.
* La **Infraestructura** maneja la base de datos In-Memory.
* La **Web API** actúa exclusivamente como puerto de entrada (Endpoints).

Al extraer la Vista hacia un proyecto separado en React, el sistema C# se libera de renderizar HTML y se enfoca 100% en procesar matemáticas de IA, devolviendo resultados mediante JSON.

#### Alternativas consideradas

| Alternativa | Por qué la descarté |
|---|---|
| **Mantener MVC monolítico** | El código se estaba convirtiendo en "espagueti". Acoplar el motor Expectiminimax directamente a los controladores web violaba el principio de Responsabilidad Única (SRP) y dificultaba el Unit Testing. |
| **Microservicios** | Dividir la IA y la base de datos en servicios separados añadía una complejidad operativa, latencia de red y requerimientos de DevOps desproporcionados para el alcance actual del proyecto. |

#### Consecuencias

**✔️ Lo que gano (Beneficios):**

* **Desacoplamiento Absoluto:** Si en el futuro se desea cambiar la base de datos In-Memory por SQL Server, o la interfaz web por una App Móvil (MAUI), el núcleo de la IA y el Dominio no sufrirán ni una sola línea de modificación.
* **Profesionalización del Código:** La implementación de repositorios, inyección de servicios y DTOs refleja un dominio profundo del diseño de software a nivel empresarial.
* **Reactividad:** El usuario (jugador de Randomlocke) experimenta una interfaz instantánea sin recargas de página.

**⚠️ Lo que asumo (Trade-offs):**

* **Curva de Complejidad:** Requiere el manejo simultáneo de dos entornos de ejecución distintos y la gestión de dependencias tanto en NuGet (C#) como en npm (Node.js).
* **Sobrecarga Estructural:** La cantidad de archivos e interfaces (contratos) incrementa significativamente en comparación con un proyecto simple, lo cual fue mitigado mediante la estructuración del proyecto en un Monorepo organizado.

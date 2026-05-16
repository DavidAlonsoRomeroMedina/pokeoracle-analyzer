# PokeOracle: Simulador Predictivo para Randomlockes 🎮🔮

¡Bienvenido a **PokeOracle**! Este es un proyecto desarrollado para la asignatura de **Arquitectura de Software**. Consiste en un simulador web de combates individuales de Pokémon de Primera Generación, diseñado específicamente como una herramienta de soporte para jugadores de retos *Randomlocke*. 

La aplicación cuenta con un motor de Inteligencia Artificial (inspirado en la lógica predictiva de los motores de ajedrez) que analiza el estado actual del combate con movimientos y habilidades aleatorias para calcular probabilísticamente la mejor jugada posible (atacar o cambiar de Pokémon) con el fin de minimizar riesgos.

---

## 🚀 Características Principales
* **Simulación de 1ra Generación:** Reglas lógicas y de combate basadas inicialmente en la región de Kanto.
* **Soporte Randomlocke:** Capacidad de asignar movimientos y habilidades de forma completamente aleatoria a las entidades Pokémon.
* **Motor de IA Integrado:** Algoritmo de búsqueda probabilística que evalúa árboles de decisión para sugerir la acción óptima en tiempo real.
* **Arquitectura Limpia:** Desarrollado bajo el patrón **Model-View-Controller (MVC)** para garantizar un desacoplamiento total entre la lógica del juego y la interfaz de usuario.

---

## 🛠️ Tecnologías Utilizadas
* **Entorno de Desarrollo:** Visual Studio Community
* **Lenguaje de Programación:** C#
* **Framework Web:** ASP.NET Core MVC
* **Interfaz de Usuario:** HTML5, CSS3, JavaScript / Bootstrap

---

# 📑 Registro de Decisiones Arquitectónicas (ADR)

## ADR-01: Arquitectura MVC para Simulador Web de Combates Pokémon

| Campo  | Valor |
|--------|-------|
| Autor  | David Alonso Romero Medina |
| Fecha  | 15/05/2026 |
| Estado | `Propuesto` |

### Contexto
Se está construyendo una página web que funciona como un simulador de combates individuales de Pokémon de primera generación, integrando un motor de Inteligencia Artificial de predicción de jugadas. El sistema resuelve el problema de la incertidumbre y el cálculo complejo de riesgos (daño, probabilidades, tipos) en formatos de juego impredecibles, específicamente los retos *Randomlocke*. Está dirigido a la comunidad de jugadores, *streamers* y analistas competitivos. 

El proyecto está condicionado a ser desarrollado de forma individual para la asignatura de Arquitectura de Software, en el entorno de Visual Studio Community. Esto requiere aprovechar los conocimientos adquiridos en clase, optimizar el tiempo de desarrollo y asegurar que la base de código sea lo suficientemente robusta para permitir la integración de futuras generaciones de Pokémon de manera escalable.

### Decisión
Se ha decidido estructurar la aplicación utilizando el **Patrón Arquitectónico Model-View-Controller (MVC)** implementado a través de **ASP.NET Core MVC con C#**.

#### ¿Por qué?
La separación de responsabilidades que ofrece MVC es la solución exacta para este problema. La lógica matemática del motor de la IA (búsqueda de árboles de decisión, cálculo de daño y probabilidades) es altamente compleja y debe estar completamente aislada de la interfaz gráfica. 

Al usar MVC en ASP.NET, el **Modelo** gestionará todas las reglas de negocio puras (estadísticas, tipos, heurística de la IA), el **Controlador** orquestará la solicitud del usuario (ej. pedir una predicción), y la **Vista** se limitará únicamente a renderizar la interfaz de la batalla en el navegador web. C# como lenguaje proporciona un tipado estricto y programación orientada a objetos fuerte, lo cual es vital para modelar las entidades de un sistema con tantas variables como Pokémon.

#### Alternativas consideradas

| Alternativa | Por qué la descarté |
|-------------|---------------------|
| **Script monolítico en consola (Python/C++)** | Aunque facilita la programación rápida del algoritmo lógico de la IA, carece de la interfaz gráfica amigable (View) necesaria para una página web, lo cual limitaría drásticamente su adopción por parte de *streamers* o jugadores casuales. |
| **Arquitectura SPA (React/Angular + API REST)** | Separar el front-end y el back-end de forma absoluta introduciría una complejidad innecesaria para esta fase del cuatrimestre. Configurar y mantener dos proyectos distintos consumiría tiempo que debe invertirse en la lógica de la IA. |
| **Desarrollo de capa única (Todo en el Code-Behind/Vista)** | Mezclar la lógica de la evaluación de daño y la IA en los mismos archivos que manejan los botones web generaría "código espagueti". Añadir mecánicas de futuras generaciones rompería el código y haría imposible su mantenimiento. |

### Consecuencias

** Lo que gano:**
* **Consecuencia técnica (Escalabilidad y Testing):** El sistema se vuelve altamente modular. Al estar separada la lógica en el Modelo, podré realizar pruebas unitarias (*Unit Testing*) de los algoritmos de daño e IA sin tener que cargar o depender de la interfaz web. Además, agregar nuevas generaciones en el futuro será cuestión de extender los Modelos sin reescribir la aplicación web.
* **Consecuencia sobre el proceso:** Esta separación me permite dividir mi trabajo en fases claras: primero enfocarme puramente en la lógica de combate (Back-end) y posteriormente en el diseño y presentación visual (Front-end), sin que los errores de uno afecten al otro.

** Lo que sacrifico o asumo:**
* **Limitación técnica:** Mayor sobrecarga inicial de código (*Boilerplate*). Implementar MVC requiere crear una estructura de carpetas estricta, mapeo de rutas y transferencia de datos entre Controladores y Vistas, lo cual exige más tiempo de configuración inicial.
* **Deuda o riesgo:** El motor de IA, al evaluar cientos de posibles ramificaciones de movimientos y habilidades en un turno, podría generar cuellos de botella en el rendimiento del servidor (memoria y CPU) si el algoritmo de búsqueda C# no se optimiza adecuadamente conforme el proyecto escale y se agreguen más combinaciones.

---

##  Estructura Inicial de Datos (Modelos)
Para que el motor de simulación funcione, el **Modelo** manejará las siguientes entidades clave en C#:

1.  **`Pokemon`:** Contiene nombre, tipos elementales, estadísticas base/actuales (PS, Ataque, Defensa, Especial, Velocidad) y estados alterados.
2.  **`Movimiento`:** Almacena el tipo elemental, potencia, precisión, categoría (físico/especial) y efectos secundarios de cada ataque.
3.  **`Habilidad`:** Modificadores de daño o estado que alteran las reglas base del combate.
4.  **`EstadoBatalla`:** Registra la situación actual en el campo (Pokémon activos, clima, modificadores de estadísticas y el historial de turnos).
5.  **`NodoDecision`:** Utilizado por la IA para mapear las acciones posibles, asignarles un valor de riesgo (heurística) y determinar la probabilidad de éxito.

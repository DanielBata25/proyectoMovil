# 🌱 Portal Agro-Comercial del Huila

**Proyecto académico desarrollado por aprendices del SENA**, cuyo propósito es **impulsar la comercialización digital de productos agrícolas del departamento del Huila**, conectando directamente a productores locales con consumidores mediante una plataforma moderna, accesible y segura.

Este repositorio contiene la **documentación oficial** del proyecto, incluyendo información funcional, técnica y de despliegue.  
Forma parte de un ecosistema de repositorios interconectados que representan cada componente del sistema.

---

## 👥 Equipo de trabajo

| Rol | Nombre |
|-----|---------|
| Líder de proyecto | **Sergio Leguízamo** |
| Desarrollador backend | **Andrés Trespalacios** |
| Desarrollador frontend | **Daniel Bata** |

---

## 🎯 Propósito del proyecto

El **Portal Agro-Comercial del Huila** busca fortalecer el comercio local y apoyar a los productores rurales mediante una herramienta digital que facilite la visibilidad de sus productos, el contacto con nuevos clientes y la gestión de sus ventas de forma eficiente y segura.

---

## 💡 Descripción general

La plataforma permite que los **productores creen su perfil**, registren sus **productos agrícolas**, y reciban **pedidos de consumidores** interesados.  
El sistema ofrece un entorno intuitivo y confiable que promueve la **economía campesina** y la **transformación digital** del sector agropecuario huilense.

---

## 🌾 Funcionalidades principales

- **Registro y autenticación de usuarios.**  
  Permite crear cuentas seguras para productores y consumidores.

- **Perfiles de productores.**  
  Cada productor puede gestionar su información, mostrar su finca y sus productos, y compartir su perfil mediante un **código QR**.

- **Gestión de productos.**  
  Publicación, actualización y eliminación de productos agrícolas con imágenes y descripciones detalladas.

- **Pedidos en línea.**  
  Los consumidores pueden realizar pedidos, subir comprobantes de pago y hacer seguimiento del estado de su compra.

- **Sistema de reseñas.**  
  Los compradores pueden calificar y dejar comentarios sobre los productos adquiridos.

- **Panel de control.**  
  Permite a los productores visualizar sus ventas, pedidos y estadísticas de desempeño.

---

## 🧩 Ecosistema del proyecto

El proyecto se encuentra dividido en varios repositorios según su responsabilidad dentro de la arquitectura:

| Componente | Descripción | Enlace |
|-------------|--------------|--------|
| 🖥️ **Portal (Frontend Web)** | Interfaz web desarrollada en Angular, accesible desde navegadores. | [portal-agro-portal](https://github.com/Leguizamo2502/portal-agro-portal) |
| ⚙️ **API (Backend)** | Servicios web REST desarrollados en .NET 8 para manejo de lógica de negocio. | [portal-agro-api](https://github.com/Leguizamo2502/portal-agro-huila-api) |
| 📱 **App Móvil** | Versión móvil híbrida construida con Ionic y Angular. | [portal-agro-app](https://github.com/DanielBata25/portal-agro-app) |
| 🗄️ **Base de datos** | Scripts, modelos y configuraciones SQL / PostgreSQL para persistencia de datos. | [portal-agro-db](https://github.com/Leguizamo2502/portal-agro-db) |
| 📘 **Documentación (Actual)** | Guías, diagramas y reportes técnicos y funcionales del proyecto. | *(Este repositorio)* |

---

## ⚙️ Tecnologías utilizadas

### **Backend**
- .NET 8 (C#)
- Entity Framework Core / Dapper
- SQL Server / PostgreSQL
- Mapster (mapeo entre entidades y DTOs)
- FluentValidation (validaciones de negocio)
- Docker / Docker Compose
- Cloudinary (gestión de imágenes)
- JWT (autenticación segura)

### **Frontend Web**
- Angular 19
- Angular Material / Bootstrap
- Chart.js (gráficas)
- Leaflet (mapas interactivos)
- SweetAlert2 (alertas y confirmaciones)

### **Aplicación móvil**
- Ionic + Capacitor (Angular base)
- Android SDK
- Storage y manejo de sesión local

---

## 🌍 Ambientes del proyecto

El sistema cuenta con distintos entornos para su desarrollo y prueba:

- **Develop:** desarrollo activo de nuevas funciones.  
- **QA:** entorno de control de calidad y pruebas internas.  
- **Staging:** entorno de preproducción para pruebas finales.  
- **Main:** versión estable de producción.

---

## 🧭 Impacto del proyecto

El Portal Agro-Comercial del Huila **promueve la economía local**, reduce la intermediación en las ventas agrícolas y fomenta el uso de herramientas tecnológicas entre comunidades rurales.  
Su enfoque educativo busca también **formar aprendices en el desarrollo de software**, aplicando conocimientos reales de programación, bases de datos y diseño web.

---

## 🏁 Estado actual

El proyecto se encuentra en fase funcional con módulos activos de:
- Autenticación y usuarios.  
- Gestión de productores, fincas y productos.  
- Flujo completo de pedidos y reseñas.  
- Despliegue en contenedores para entornos de prueba.  
- Documentación estructurada en proceso de consolidación.

---

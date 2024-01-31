# Documentación de la API del Blog

## Scripts

## Instalar dependencias

- $ npm install

## Ejecutar aplicación

- **start**: Inicia la aplicación NestJS.
  $ npm start

- **start:dev**: Inicia la aplicación en modo desarrollo con reinicio automático.
  $ npm run start:dev

- **start:debug**: Inicia la aplicación en modo depuración con reinicio automático.
  $ npm run start:debug

- **start:prod**: Inicia la aplicación en modo de producción.
  $ npm run start:prod

## Compilar aplicación

- **build**: Compila el proyecto NestJS.
  $ npm run build

## Formatear aplicación

- **format**: Formatea los archivos TypeScript usando Prettier.
  $ npm run format

## Detectar problemas de estilo

- **lint**: Ejecuta ESLint para buscar y corregir problemas de estilo.
  $ npm run lint

## Tests

- **test**: Ejecuta los casos de prueba Jest.
  $ npm test

- **test:watch**: Ejecuta los casos de prueba Jest en modo observador.
  $ npm run test:watch

- **test:cov**: Ejecuta los casos de prueba Jest y genera informes de cobertura.
  $ npm run test:cov

- **test:debug**: Ejecuta los casos de prueba Jest en modo de depuración.
  $ npm run test:debug

- **test:e2e**: Ejecuta los casos de prueba end-to-end Jest.
  $ npm run test:e2e

Asegúrate de tener Node.js y npm instalados antes de ejecutar estos scripts.

## Endpoints de Usuario

### Obtener Todos los Usuarios (Solo para Administradores)

- **Endpoint:** `/admin/users`
- **Método:** GET
- **Descripción:** Obtener una lista de todos los usuarios. Solo accesible para usuarios con el rol "admin".
- **Solicitud:**
  - Headers:
    - Authorization: Bearer <Token JWT>
- **Respuesta:**
  - Éxito (200 OK):
    ```json
    [
      {
        "name": "Juan",
        "surname": "Pérez",
        "email": "juan@example.com",
        "username": "juan_perez",
        "role": "usuario"
      }
      // ... otros usuarios
    ]
    ```
  - Error (4xx o 5xx):
    ```json
    {
      "message": "Mensaje de error"
    }
    ```

### Obtener Todos los Usuarios Públicos

- **Endpoint:** `/users`
- **Método:** GET
- **Descripción:** Obtener una lista de información pública de usuarios.
- **Respuesta:**
  - Éxito (200 OK):
    ```json
    [
      {
        "username": "juan_perez"
      }
      // ... otros usuarios
    ]
    ```
  - Error (4xx o 5xx):
    ```json
    {
      "message": "Mensaje de error"
    }
    ```

### Obtener Perfil de Usuario

- **Endpoint:** `/usuarios/:username`
- **Método:** GET
- **Descripción:** Obtener el perfil público de un usuario por su nombre de usuario.
- **Parámetros:**
  - `username` (string): El nombre de usuario del usuario.
- **Respuesta:**
  - Éxito (200 OK):
    ```json
    {
      "name": "Juan",
      "surname": "Pérez",
      "username": "juan_perez",
      "email": "juan@example.com"
    }
    ```
  - Error (4xx o 5xx):
    ```json
    {
      "message": "Mensaje de error"
    }
    ```

### Actualizar Perfil de Usuario

- **Endpoint:** `/usuarios/:username`
- **Método:** PUT
- **Descripción:** Actualizar el perfil de un usuario por su nombre de usuario. Solo accesible para el usuario o administrador.
- **Parámetros:**
  - `username` (string): El nombre de usuario del usuario.
- **Solicitud:**
  - Headers:
    - Authorization: Bearer <Token JWT>
  - Body (JSON):
    ```json
    {
      "name": "Nuevo Nombre",
      "surname": "Nuevo Apellido"
    }
    ```
- **Respuesta:**
  - Éxito (200 OK):
    ```json
    {
      "message": "Perfil actualizado exitosamente"
    }
    ```
  - Error (4xx o 5xx):
    ```json
    {
      "message": "Mensaje de error"
    }
    ```

### Eliminar Perfil de Usuario

- **Endpoint:** `/usuarios/:username`
- **Método:** DELETE
- **Descripción:** Eliminar el perfil de un usuario por su nombre de usuario. Solo accesible para el usuario o administrador.
- **Parámetros:**
  - `username` (string): El nombre de usuario del usuario.
- **Solicitud:**
  - Headers:
    - Authorization: Bearer <Token JWT>
- **Respuesta:**
  - Éxito (200 OK):
    ```json
    {
      "message": "Perfil eliminado exitosamente"
    }
    ```
  - Error (4xx o 5xx):
    ```json
    {
      "message": "Mensaje de error"
    }
    ```

### Crear Nuevo Usuario

- **Endpoint:** `/usuarios/new`
- **Método:** POST
- **Descripción:** Crear un nuevo usuario.
- **Solicitud:**
  - Body (JSON):
    ```json
    {
      "name": "Juan",
      "surname": "Pérez",
      "username": "juan_perez",
      "email": "juan@example.com",
      "password": "strongpassword"
    }
    ```
- **Respuesta:**
  - Éxito (200 OK):
    ```json
    {
      "message": "Usuario creado exitosamente"
    }
    ```
  - Error (4xx o 5xx):
    ```json
    {
      "message": "Mensaje de error"
    }
    ```

### Cambiar Contraseña de Usuario

- **Endpoint:** `/usuarios/:username/change-pass`
- **Método:** PUT
- **Descripción:** Cambiar la contraseña de un usuario por su nombre de usuario. Solo accesible para el usuario.
- **Parámetros:**
  - `username` (string): El nombre de usuario del usuario.
- **Solicitud:**
  - Headers:
    - Authorization: Bearer <Token JWT>
  - Body (JSON):
    ```json
    {
      "password": "password actual",
      "newpassword": "nueva password segura"
    }
    ```
- **Respuesta:**
  - Éxito (200 OK):
    ```json
    {
      "message": "Contraseña cambiada exitosamente"
    }
    ```
  - Error (4xx o 5xx):
    ```json
    {
      "message": "Mensaje de error"
    }
    ```

## Endpoints de Autenticación

### Inicio de Sesión de Usuario

- **Endpoint:** `/auth/login`
- **Método:** POST
- **Descripción:** Autenticar e iniciar sesión de un usuario.
- **Solicitud:**
  - Body (JSON):
    ```json
    {
      "username": "juan_perez",
      "password": "strongpassword"
    }
    ```
- **Respuesta:**
  - Éxito (200 OK):
    ```json
    {
      "token": "Token JWT"
    }
    ```
  - Error (4xx o 5xx):
    ```json
    {
      "message": "Mensaje de error"
    }
    ```

## Endpoints de Posts

### Obtener Todos los Posts

- **Endpoint:** `/posts`
- **Método:** GET
- **Descripción:** Obtener una lista de todos los posts.
- **Respuesta:**
  - Éxito (200 OK):
    ```json
    [
      {
        "title": "Título del Post",
        "content": "Contenido del Post",
        "author": "juan_perez"
      }
      // ... otros posts
    ]
    ```
  - Error (4xx o 5xx):
    ```json
    {
      "message": "Mensaje de error"
    }
    ```

### Obtener Post por ID

- **Endpoint:** `/posts/:id`
- **Método:** GET
- **Descripción:** Obtener un post por su ID.
- **Parámetros:**
  - `id` (string): El ID del post.
- **Respuesta:**
  - Éxito (200 OK):
    ```json
    {
      "title": "Título del Post",
      "content": "Contenido del Post",
      "author": "juan_perez"
    }
    ```
  - Error (4xx o 5xx):
    ```json
    {
      "message": "Mensaje de error"
    }
    ```

### Crear Nuevo Post

- **Endpoint:** `/posts/new`
- **Método:** POST
- **Descripción:** Crear un nuevo post.
- **Solicitud:**
  - Headers:
    - Authorization: Bearer <Token JWT>
  - Body (JSON):
    ```json
    {
      "title": "Título del Post",
      "content": "Contenido del Post"
    }
    ```
- **Respuesta:**
  - Éxito (200 OK):
    ```json
    {
      "message": "Post creado exitosamente"
    }
    ```
  - Error (4xx o 5xx):
    ```json
    {
      "message": "Mensaje de error"
    }
    ```

### Actualizar Post por ID

- **Endpoint:** `/posts/:id`
- **Método:** PUT
- **Descripción:** Actualizar un post por su ID. Solo accesible para el autor del post.
- **Parámetros:**
  - `id` (string): El ID del post.
- **Solicitud:**
  - Headers:
    - Authorization: Bearer <Token JWT>
  - Body (JSON):
    ```json
    {
      "title": "Título Actualizado",
      "content": "Contenido Actualizado"
    }
    ```
- **Respuesta:**
  - Éxito (200 OK):
    ```json
    {
      "message": "Post actualizado exitosamente"
    }
    ```
  - Error (4xx o 5xx):
    ```json
    {
      "message": "Mensaje de error"
    }
    ```

### Eliminar Post por ID

- **Endpoint:** `/posts/:id`
- **Método:** DELETE
- **Descripción:** Eliminar un post por su ID. Solo accesible para el autor del post.
- **Parámetros:**
  - `id` (string): El ID del post.
- **Solicitud:**
  - Headers:
    - Authorization: Bearer <Token JWT>
- **Respuesta:**
  - Éxito (200 OK):
    ```json
    {
      "message": "Post eliminado exitosamente"
    }
    ```
  - Error (4xx o 5xx):
    ```json
    {
      "message": "Mensaje de error"
    }
    ```

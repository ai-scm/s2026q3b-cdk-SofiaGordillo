# Ejercicio: Creación de una Lambda y un bucket S3 con AWS CDK

## 1. Objetivo

El objetivo del ejercicio fue realizar el tutorial **“Create your first AWS CDK app”** utilizando **AWS CDK v2 con TypeScript**, y posteriormente modificar la aplicación para que, además de crear una función Lambda, también:

* Cree un bucket de Amazon S3.
* Cree automáticamente un archivo de texto llamado `hola.txt`.
* Coloque dicho archivo dentro del bucket.
* El archivo debe contener el texto `hola mundo`.
* Todo el proceso debe realizarse automáticamente mediante infraestructura como código con AWS CDK.

---

## 2. ¿Qué es AWS CDK?

**AWS CDK (Cloud Development Kit)** es una herramienta de AWS que permite definir infraestructura utilizando lenguajes de programación como TypeScript, Python, Java o C#.

En lugar de crear los recursos manualmente desde la consola de AWS, se describen mediante código.

En este ejercicio, el código de CDK define:

* Una función Lambda.
* Un bucket S3.
* La carga automática de un archivo al bucket.

Posteriormente, CDK transforma ese código en una plantilla de **AWS CloudFormation**, que se encarga de crear los recursos en AWS.

---

## 3. Creación del proyecto

Primero se creó el proyecto de CDK utilizando TypeScript:

```bash
mkdir cdk-hello-world
cd cdk-hello-world
cdk init app --language typescript
```

Esto generó la estructura básica del proyecto.

La estructura principal quedó:

```text
cdk-hello-world/
├── bin/
├── lib/
├── test/
├── assets/
├── cdk.json
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

La carpeta `lib/` contiene la definición de la infraestructura, mientras que `bin/` contiene el punto de entrada de la aplicación CDK.

---

## 4. Creación de la función Lambda

Se agregó una función Lambda utilizando el módulo:

```typescript
import * as lambda from 'aws-cdk-lib/aws-lambda';
```

La función se definió de esta manera:

```typescript
const hello = new lambda.Function(this, 'HelloHandler', {
  runtime: lambda.Runtime.NODEJS_22_X,
  code: lambda.Code.fromInline(`
    exports.handler = async function(event) {
      return {
        statusCode: 200,
        body: 'Hello from Lambda!'
      };
    };
  `),
  handler: 'index.handler',
});
```

Esta configuración indica que:

* La función utiliza **Node.js 22**.
* El código de Lambda se proporciona directamente desde CDK.
* El punto de entrada es `index.handler`.
* La función devuelve el mensaje `Hello from Lambda!`.

---

## 5. Creación del bucket S3

Después se agregó un bucket de Amazon S3:

```typescript
import * as s3 from 'aws-cdk-lib/aws-s3';
```

El bucket se creó mediante:

```typescript
const bucket = new s3.Bucket(this, 'HelloBucket', {
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  autoDeleteObjects: true,
});
```

El bucket permite almacenar objetos, como archivos de texto, imágenes, documentos, etc.

En este ejercicio se utilizará para almacenar el archivo `hola.txt`.

Las propiedades:

```typescript
removalPolicy: cdk.RemovalPolicy.DESTROY
```

y:

```typescript
autoDeleteObjects: true
```

se utilizaron para facilitar la eliminación de los recursos durante las pruebas del ejercicio.

Estas opciones son apropiadas para un laboratorio, pero deben utilizarse con precaución en ambientes de producción porque permiten eliminar el bucket y sus objetos cuando se destruye el stack.

---

## 6. Creación del archivo hola.txt

Se creó una carpeta llamada `assets`:

```bash
mkdir -p assets
```

Después se creó el archivo:

```bash
echo "hola mundo" > assets/hola.txt
```

El contenido del archivo es:

```text
hola mundo
```

La idea fue que este archivo no tuviera que ser cargado manualmente desde la consola de AWS.

---

## 7. Carga automática del archivo mediante CDK

Para realizar la carga automática se utilizó `BucketDeployment`.

En CDK v2 se importa desde:

```typescript
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
```

Y se configuró:

```typescript
new s3deploy.BucketDeployment(this, 'DeployHelloFile', {
  sources: [
    s3deploy.Source.asset('./assets'),
  ],
  destinationBucket: bucket,
});
```

Esta parte es importante porque indica a CDK que debe tomar los archivos existentes en:

```text
./assets
```

y copiarlos automáticamente al bucket S3.

Por lo tanto, durante el despliegue:

```text
assets/hola.txt
        │
        │ CDK
        ▼
     S3 Bucket
        │
        ▼
    hola.txt
```

---

## 8. Validación con CDK Synth

Antes de desplegar los recursos se ejecutó:

```bash
cdk synth
```

Este comando permite comprobar que la infraestructura definida mediante TypeScript puede convertirse correctamente en una plantilla de CloudFormation.

También se verificó que la plantilla contuviera los recursos:

```text
AWS::Lambda::Function
AWS::S3::Bucket
AWS::S3::BucketPolicy
Custom::CDKBucketDeployment
```

Esto permitió confirmar que CDK estaba generando tanto la Lambda como el bucket y el mecanismo necesario para realizar la carga automática del archivo.

---

## 9. Despliegue en AWS

Una vez validada la plantilla, se realizó el despliegue:

```bash
cdk deploy --profile sofia
```

El despliegue terminó correctamente con:

```text
✅ CdkHelloWorldStack
```

Esto significa que AWS CloudFormation creó exitosamente los recursos definidos por el stack.

El stack creado fue:

```text
CdkHelloWorldStack
```

y se desplegó en la región:

```text
us-east-1
```

---

## 10. Verificación del bucket

Después del despliegue se obtuvo el nombre real del bucket mediante AWS CloudFormation:

```bash
aws cloudformation describe-stack-resources \
  --stack-name CdkHelloWorldStack \
  --profile sofia \
  --query "StackResources[?ResourceType=='AWS::S3::Bucket'].PhysicalResourceId" \
  --output text
```

El bucket creado fue:

```text
cdkhelloworldstack-hellobucketa5fa8af2-sduyolm7qyqq
```

---

## 11. Verificación del archivo

Finalmente se comprobó directamente desde AWS que el archivo había sido cargado correctamente:

```bash
aws s3 cp \
  s3://cdkhelloworldstack-hellobucketa5fa8af2-sduyolm7qyqq/hola.txt \
  - \
  --profile sofia
```

El resultado fue:

```text
hola mundo
```

Esto demuestra que el archivo fue creado y posteriormente cargado automáticamente al bucket mediante CDK.

---

# 12. Arquitectura final

La infraestructura creada puede representarse de la siguiente manera:

```text
                    AWS CDK
                       │
                       ▼
              CloudFormation
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
          Lambda               S3 Bucket
             │                   │
             │                   ▼
             │               hola.txt
             │                   │
             │              "hola mundo"
             │
             ▼
       Hello from Lambda!
```

---

# 13. Archivos principales

### `lib/cdk-hello-world-stack.ts`

Es el archivo más importante del ejercicio porque contiene la definición de los recursos de infraestructura:

* Lambda.
* S3.
* BucketDeployment.

### `assets/hola.txt`

Es el archivo que CDK copia automáticamente al bucket.

Contenido:

```text
hola mundo
```

### `bin/cdk-hello-world.ts`

Es el punto de entrada de la aplicación CDK y se encarga de crear la instancia del stack.

### `cdk.json`

Contiene la configuración utilizada por CDK para ejecutar la aplicación.

### `package.json`

Contiene las dependencias de Node.js y CDK utilizadas por el proyecto.

---

# 14. ¿Cuál fue la ventaja de utilizar CDK?

La principal ventaja es que la infraestructura puede definirse mediante código y reproducirse fácilmente.

En lugar de:

1. Crear manualmente una Lambda.
2. Crear manualmente un bucket.
3. Subir manualmente el archivo.
4. Configurar los recursos uno por uno.

Con CDK simplemente se define la infraestructura en código y se ejecuta:

```bash
cdk deploy
```

CDK se encarga de crear los recursos y configurar las dependencias necesarias.

Esto permite tener una infraestructura:

* Automatizada.
* Reproducible.
* Versionable con Git.
* Fácil de modificar.
* Fácil de desplegar nuevamente.

---

# 15. Resultado final

El ejercicio fue completado satisfactoriamente.

Se logró crear mediante AWS CDK:

* Una función **AWS Lambda**.
* Un bucket **Amazon S3**.
* Un proceso automático de despliegue del archivo.
* El archivo `hola.txt`.
* El contenido `hola mundo`.

La comprobación final desde AWS devolvió:

```text
hola mundo
```

Por lo tanto, se verificó que el archivo fue almacenado correctamente en el bucket S3 y que todo el proceso fue realizado mediante infraestructura como código con AWS CDK.

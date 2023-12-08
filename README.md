## Install

```
npm install turbopuffer-sdk
```

## Usage

```js
const namespace = 'test'
const upsertRes = await client.upsertVectors({
    namespace,
    vectors: [{ id: 1, vector: [1, 2, 3], attributes: { hello: 'ciao' } }],
})

const vectors = await client.listAllVectors({ namespace })

const delRes = await client.deleteNamespace({ namespace })
```

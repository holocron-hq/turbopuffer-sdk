## Install

```
npm install turbopuffer-sdk
```

## Usage

```js
const client = new TurboPufferApiClientV1({
    token: process.env.TURBOPUFFER_KEY,
})

const namespace = 'test'
const upsertRes = await client.upsertVectors({
    namespace,
    vectors: [{ id: 1, vector: [1, 2, 3], attributes: { hello: 'ciao' } }],
})

const vectors = await client.listAllVectors({ namespace })

const results = await puffer.queryVectors({
    namespace,
    distance_metric: 'cosine_distance',
    include_attributes,
    vector: [1, 2, 3],
})

const delRes = await client.deleteNamespace({ namespace })
```

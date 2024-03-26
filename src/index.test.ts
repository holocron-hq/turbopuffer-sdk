import { test, expect } from 'vitest'
import { TurboPufferApiClientV1 } from '.'

const client = new TurboPufferApiClientV1({
    token: process.env.TURBOPUFFER_KEY,
})

test('works', async () => {
    const namespace = 'test'
    const upsertRes = await client.upsertVectors({
        namespace,
        vectors: [{ id: 1, vector: [1, 2, 3], attributes: { hello: 'ciao' } }],
        distance_metric: "cosine_distance"
    })
    console.log({ upsertRes })
    const vectors = await client.listAllVectors({ namespace })
    const searched = await client.queryVectors({
        namespace,
        top_k: 1200,
        filters: { id: [['In', [1, 2, 3]]] },
    })
    console.log({ vectors, searched })
    // const delRes = await client.deleteNamespace({ namespace })
    // console.log({ delRes })
})

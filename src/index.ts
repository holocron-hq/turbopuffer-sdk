import pako from 'pako'

type Status = 'ok' | 'error'

type ErrorResult = {
    status: 'error'
    error: string
}

type Id = number // add string when larger numbers are added to the API

export class TurboPufferError extends Error {
    status: number
    constructor(public error: string, { status }: { status: number }) {
        super(error)
        this.status = status
    }
}
export class TurboPufferApiClientV1<Attributes extends Record<string, any>> {
    private baseUrl: string
    token?: string
    constructor({ baseUrl = 'https://api.turbopuffer.com', token }) {
        this.baseUrl = baseUrl
        this.token = token
    }

    async request({
        method,
        path,
        query,
        body,
        compress,
    }: {
        method: string
        path: string
        query?: any
        body?: any
        compress?: boolean
    }): Promise<any> {
        const url = new URL(`${this.baseUrl}${path}`)

        if (query) {
            Object.keys(query).forEach((key) => {
                const v = query[key]?.toString()
                if (v != null) {
                    url.searchParams.append(key, v)
                }
            })
        }

        const headers = {
            'Content-Type': 'application/json',
            'Accept-Encoding': 'gzip',
            Authorization: `Bearer ${this.token}`,
        }

        const options: RequestInit = {
            method,
            headers,
        }

        if (compress && body) {
            headers['Content-Encoding'] = 'gzip'
            options.body = pako.gzip(JSON.stringify(body))
        } else if (body) {
            options.body = JSON.stringify(body)
        }

        const res = await fetch(url.toString(), options)
        const json = (await res.json()) as any
        if (json.status === 'error') {
            throw new TurboPufferError(json.error || 'error', {
                status: res.status,
            })
        }

        return json as any
    }

    private async listVectors({
        namespace,
        cursor,
    }: {
        namespace: string
        cursor?: string
    }): Promise<{
        ids: Id[]
        vectors: number[][]
        attributes?: Attributes
        next_cursor?: string | null
        status: undefined
    }> {
        return await this.request({
            method: 'GET',
            path: `/v1/vectors/${namespace}`,
            query: { cursor },
        })
    }
    async listAllVectors({
        namespace,
        limit = Infinity,
    }: {
        namespace: string
        limit?: number
    }): Promise<
        | {
              vector: number[]
              id: Id
              attributes?: Attributes
          }[]
    > {
        let n = 0
        let next_cursor = undefined
        const allVectors = [] as {
            vector: number[]
            id: Id
            attributes?: Attributes
        }[]
        while (n < limit) {
            const res = await this.listVectors({
                namespace,
                cursor: next_cursor,
            })

            allVectors.push(...(convertToArrayOfVectors(res) as any))
            if (!next_cursor) {
                break
            }
        }
        return allVectors
    }
    async deleteNamespace({ namespace }: { namespace: string }): Promise<any> {
        return await this.request({
            method: 'DELETE',
            path: `/v1/vectors/${namespace}`,
        })
    }

    async queryVectors({
        namespace,
        ...rest
    }: {
        namespace: string

        vector: number[]
        distance_metric: 'cosine_distance' | 'euclidean_squared'
        top_k?: number
        filters?: { [key: string]: string[] }
        include_vectors?: boolean
        include_attributes?: string[]
    }): Promise<
        {
            id: Id
            dist: number
            vector: number[]
            attributes?: Attributes
        }[]
    > {
        return await this.request({
            method: 'POST',
            path: `/v1/vectors/${namespace}/query`,
            body: rest,
        })
    }
    async upsertVectors({
        namespace,
        vectors,
    }: {
        namespace: string
        vectors: Vector[]
    }): Promise<{ status: Status }> {
        const requestBody = fromArrayOfVectors(vectors)
        return await this.request({
            method: 'POST',
            path: `/v1/vectors/${namespace}`,
            body: requestBody,
            compress: true,
        })
    }
}

type Vector = {
    id: Id
    vector: number[]
    attributes?: { [key: string]: any }
}

function convertToArrayOfVectors(res: {
    attributes?: { [key: string]: any }
    ids: Id[]
    vectors: number[][]
}) {
    const allVectors = [] as Vector[]
    const attrEntries = Object.entries(res.attributes || {})
    for (let i = 0; i < res.ids.length; i++) {
        allVectors.push({
            id: res.ids[i],
            vector: res.vectors[i],
            attributes: res.attributes
                ? Object.fromEntries(
                      attrEntries.map(([key, values]: any) => [key, values[i]]),
                  )
                : undefined,
        })
    }
    return allVectors
}
function fromArrayOfVectors(vecs: Vector[]): {
    attributes?: { [key: string]: any[] }
    ids: Id[]
    vectors: number[][]
} {
    const ids = vecs.map((v) => v.id)
    const vectors = vecs.map((v) => v.vector)
    const attrEntries = Object.entries(vecs[0].attributes || {})
    const attributes = Object.fromEntries(
        attrEntries.map(([key]) => [key, vecs.map((v) => v.attributes?.[key])]),
    )
    return { ids, vectors, attributes }
}

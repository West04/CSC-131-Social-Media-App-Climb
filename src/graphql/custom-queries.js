export const GetTopicWithPosts = /* GraphQL */ `
    query GetTopic($id: ID!) {
        getTopic(id: $id) {
            id
            title
            posts {
                items {
                    id
                    title
                    content
                    likes
                    createdByID
                    createdBy {
                        id
                        username
                        email
                    }
                    topicID
                    createdAt
                    updatedAt
                }
                nextToken
            }
            createdAt
            updatedAt
        }
    }
`;


export const GetTopicWithPostsAttempt2 = /* GraphQL */ `
    query GetTopic($id: ID!) {
        getTopic(id: $id) {
            id
            title
            posts {
                items {
                    id
                    title
                    content
                    likes
                    createdByID
                    createdBy {
                        id
                        username
                    }
                    createdAt
                    updatedAt
                }
                nextToken
            }
            createdAt
            updatedAt
        }
    }
`;





export const ListTopicsWithPosts = /* GraphQL */ `
    query ListTopics(
        $filter: ModelTopicFilterInput
        $limit: Int
        $nextToken: String
    ) {
        listTopics(filter: $filter, limit: $limit, nextToken: $nextToken) {
            items {
                id
                title
                posts {
                    items {
                        id
                        __typename
                    }
                    __typename
                }
                createdAt
                updatedAt
                __typename
            }
            nextToken
            __typename
        }
    }
`;
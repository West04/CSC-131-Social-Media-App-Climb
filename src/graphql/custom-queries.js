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
                    }
                }
                createdAt
                updatedAt
            }
            nextToken
        }
    }
`;
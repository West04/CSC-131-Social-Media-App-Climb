// GraphQL query to fetch a specific topic by its ID, including detailed information about the topic and its associated posts
export const GetTopicWithPosts = /* GraphQL */ `
    query GetTopic($id: ID!) {
        # Query to retrieve a single topic using its unique identifier
        getTopic(id: $id) {
            # Basic topic information
            id
            title
            
            # Nested query to fetch posts associated with this topic
            posts {
                # List of post items with their details
                items {
                    id
                    title
                    content
                    likes
                    createdByID
                    
                    # Fetch detailed information about the user who created the post
                    createdBy {
                        id
                        username
                        email
                    }
                    topicID
                    createdAt
                    updatedAt
                }
                # Pagination token for fetching additional posts if needed
                nextToken
            }
            createdAt
            updatedAt
        }
    }
`;

// GraphQL query to list topics with a minimal set of post information
export const ListTopicsWithPosts = /* GraphQL */ `
    query ListTopics(
        # Optional filter to narrow down the list of topics
        $filter: ModelTopicFilterInput
        # Limit the number of topics returned
        $limit: Int
        # Pagination token for fetching subsequent pages of results
        $nextToken: String
    ) {
        # Query to retrieve a list of topics based on optional filters and pagination
        listTopics(filter: $filter, limit: $limit, nextToken: $nextToken) {
            # List of topic items with minimal information
            items {
                id
                title
                
                # Fetch a minimal set of post information for each topic
                posts {
                    items {
                        id
                        # Typename used for GraphQL client-side type identification
                        __typename
                    }
                    # Typename for the posts connection
                    __typename
                }
                createdAt
                updatedAt
                # Typename for the topic
                __typename
            }
            # Token for fetching next page of results
            nextToken
            # Typename for the topics list connection
            __typename
        }
    }
`;


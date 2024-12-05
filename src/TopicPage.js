// Import necessary React hooks and modules for functionality
import React, { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api'; // AWS Amplify client for API interactions
import { GetTopicWithPosts } from './graphql/custom-queries'; // GraphQL query to fetch topic details with posts
import { createPost, updatePost } from './graphql/mutations'; // GraphQL's mutations for creating and updating posts
import './TopicPage.css'; // CSS file for styling

// Initialize the Amplify GraphQL client
const client = generateClient();

// Main component for displaying a topic page with posts
function TopicPage({ topicId, userId, onBack }) {
    // State to hold the topic details and posts
    const [topic, setTopic] = useState(null);

    // State to manage the new post inputs
    const [newPost, setNewPost] = useState({
        title: '',
        content: ''
    });

    // Loading and error states for API interactions
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // State to track errors specific to post inputs
    const [postErrors, setPostErrors] = useState({
        title: '',
        content: ''
    });

    // Fetch topic details, memoized with useCallback to avoid unnecessary re-creation
    const fetchTopicDetails = useCallback(async () => {
        setIsLoading(true);
        setError(null); // Reset error state before fetching

        try {
            // Execute the GraphQL query with the topic ID
            const response = await client.graphql({
                query: GetTopicWithPosts,
                variables: { id: topicId }
            });

            // Update the topic state with the fetched data
            setTopic(response.data.getTopic);
        } catch (err) {
            console.error('Error fetching topic details:', err);
            // Set an error message to display in the UI
            setError('Failed to load topic details. Please try again later.');
        } finally {
            setIsLoading(false); // Ensure loading state is reset
        }
    }, [topicId]);

    // Trigger fetchTopicDetails on component mount or when topicId changes
    useEffect(() => {
        fetchTopicDetails();
    }, [fetchTopicDetails]);

    // Handle changes in the post input fields
    const handlePostInputChange = (e) => {
        const { name, value } = e.target;
        // Update the newPost state dynamically based on input field
        setNewPost(prev => ({
            ...prev,
            [name]: value
        }));

        // Input validation for the title field
        if (name === 'title') {
            setPostErrors(prev => ({
                ...prev,
                title: value.trim().length < 3 ? 'Title must be at least 3 characters' : ''
            }));
        }

        // Input validation for the content field
        if (name === 'content') {
            setPostErrors(prev => ({
                ...prev,
                content: value.trim().length < 10 ? 'Content must be at least 10 characters' : ''
            }));
        }
    };

    // Handle the creation of a new post
    const handleCreatePost = async () => {
        // Validate all inputs before attempting submission
        const titleError = !newPost.title.trim() ? 'Title is required' :
            (newPost.title.trim().length < 3 ? 'Title must be at least 3 characters' : '');
        const contentError = !newPost.content.trim() ? 'Content is required' :
            (newPost.content.trim().length < 10 ? 'Content must be at least 10 characters' : '');

        // If there are validation errors, update the state and abort submission
        if (titleError || contentError) {
            setPostErrors({ title: titleError, content: contentError });
            return;
        }

        setIsLoading(true); // Set loading state during API call
        setError(null); // Reset error state

        try {
            // Execute the GraphQL mutation to create a new post
            await client.graphql({
                query: createPost,
                variables: {
                    input: {
                        title: newPost.title.trim(),
                        content: newPost.content.trim(),
                        likes: 0,
                        createdByID: userId, // Associate post with the current user
                        topicID: topicId // Associate post with the current topic
                    }
                }
            });

            // Reset the post form and refresh the topic details
            setNewPost({ title: '', content: '' });
            setPostErrors({ title: '', content: '' });
            await fetchTopicDetails(); // Refresh the posts list
        } catch (err) {
            console.error('Error creating post:', err);
            // Display an error message if the mutation fails
            setError('Failed to create post. Please try again.');
        } finally {
            setIsLoading(false); // Ensure loading state is reset
        }
    };

    // Handle liking a post by incrementing its like count
    const handleLikePost = async (postId, currentLikes) => {
        try {
            // Execute the GraphQL mutation to update the post's like count
            await client.graphql({
                query: updatePost,
                variables: {
                    input: {
                        id: postId,
                        likes: (currentLikes || 0) + 1
                    }
                }
            });

            // Optimistically update the likes count in the UI
            setTopic(prevTopic => ({
                ...prevTopic,
                posts: {
                    ...prevTopic.posts,
                    items: prevTopic.posts.items.map(post =>
                        post.id === postId
                            ? { ...post, likes: (post.likes || 0) + 1 }
                            : post
                    )
                }
            }));
        } catch (err) {
            console.error('Error liking post:', err);
            // Display an error message if the mutation fails
            setError('Failed to like post');
        }
    };

    // Render loading spinner while data is being fetched
    if (isLoading) return <div className="loading-spinner">Loading...</div>;

    // If topic details are not yet loaded, render nothing
    if (!topic) return null;

    return (
        <div className="topic-page">
            {/* Back button to navigate to the previous page */}
            <button
                onClick={onBack} // Calls the onBack function to navigate back to the topics list
                className="back-button" // CSS class for styling the button
                aria-label="Back to Topics" // Accessibility label for screen readers
            >
                ← Back to Topics {/* Visible text showing a left arrow and "Back to Topics" */}
            </button>

            {/* Display the topic title dynamically based on the fetched data */}
            <h1>{topic.title}</h1>

            {/* Error banner */}
            {error && (
                <div className="error-banner">
                    {/* Display an error message if the 'error' state is set */}
                    {error}
                </div>
            )}

            {/* Section for creating a new post */}
            <div className="create-post-section">
                <div className="input-group">
                    {/* Input field for post title */}
                    <input
                        type="text" // Specifies a single-line text input
                        name="title" // The name used to identify this input in state updates
                        placeholder="Post Title" // Placeholder text shown when the input is empty
                        value={newPost.title} // Controlled input bound to newPost.title state
                        onChange={handlePostInputChange} // Updates state on user input
                        className={`post-title-input ${postErrors.title ? 'input-error' : ''}`} // Dynamically adds 'input-error' class if there is a title error
                    />
                    {/* Conditional rendering of title validation errors */}
                    {postErrors.title && (
                        <span className="error-text">
                        {/* Display error message specific to the title */}
                            {postErrors.title}
                    </span>
                    )}
                </div>

                <div className="input-group">
                    {/* Textarea for post content */}
                    <textarea
                        name="content" // The name used to identify this input in state updates
                        placeholder="Write your post..." // Placeholder text shown when the textarea is empty
                        value={newPost.content} // Controlled input bound to newPost.content state
                        onChange={handlePostInputChange} // Updates state on user input
                        className={`post-content-input ${postErrors.content ? 'input-error' : ''}`} // Dynamically adds 'input-error' class if there is a content error
                    />
                    {/* Conditional rendering of content validation errors */}
                    {postErrors.content && (
                        <span className="error-text">
                        {/* Display error message specific to the content */}
                            {postErrors.content}
                    </span>
                    )}
                </div>

                {/* Button to submit the new post */}
                <button
                    onClick={handleCreatePost} // Calls the function to create a new post
                    disabled={isLoading} // Disables the button when data is being submitted
                    className="create-post-button" // CSS class for styling the button
                >
                    {/* Dynamic text based on loading state */}
                    {isLoading ? 'Posting...' : 'Create Post'}
                </button>
            </div>

            {/* Section displaying the list of posts */}
            <div className="posts-list">
                <h2>Posts</h2>
                {/* Check if there are no posts */}
                {topic.posts.items.length === 0 ? (
                    <p className="no-posts-message">
                        {/* Message displayed when no posts are available */}
                        No posts yet. Be the first to post!
                    </p>
                ) : (
                    topic.posts.items.map(post => (
                        // Individual post item
                        <div key={post.id} className="post-item">
                            {/* Post title */}
                            <h3>{post.title}</h3>
                            {/* Post content */}
                            <p>{post.content}</p>
                            <div className="post-metadata">
                                {/* Information about the author of the post */}
                                <span>
                                Posted by: {post.createdBy?.username || 'Anonymous'} {/* Display the author's username or "Anonymous" */}
                            </span>
                                <div className="post-actions">
                                    {/* Button to like the post */}
                                    <button
                                        onClick={() => handleLikePost(post.id, post.likes)} // Calls the function to increment the post's likes
                                        className="like-button" // CSS class for styling the like button
                                        aria-label="Like post" // Accessibility label for screen readers
                                    >
                                        👍 {post.likes || 0} {/* Like count displayed next to a thumbs-up emoji */}
                                    </button>
                                    {/* Timestamp for when the post was created, formatted to a readable string */}
                                    <span>{new Date(post.createdAt).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default TopicPage;

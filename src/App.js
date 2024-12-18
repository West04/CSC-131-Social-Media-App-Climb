// Importing necessary libraries and components
import React, { useState, useEffect, useReducer } from 'react'; // React utilities for state and lifecycle management
import './App.css'; // Main CSS file for styling the app
import { withAuthenticator } from '@aws-amplify/ui-react'; // Higher-order component for Amplify authentication
import '@aws-amplify/ui-react/styles.css'; // Styles for Amplify UI components
import awsExports from './aws-exports'; // AWS Amplify configuration file
import { Amplify } from 'aws-amplify'; // Core Amplify library
import { generateClient } from 'aws-amplify/api'; // Utility to create a GraphQL client
import { createTopic } from "./graphql/mutations"; // GraphQL's mutation to create a topic
import { ListTopicsWithPosts } from "./graphql/custom-queries"; // Custom GraphQL query to fetch topics with posts
import TopicPage from './TopicPage'; // Component for rendering topic-specific pages

// Configuring AWS Amplify with the settings from aws-exports
Amplify.configure(awsExports);

// Generating a GraphQL client instance for API calls
const client = generateClient();

// Initial state structure for the application
const initialState = {
    backgroundColor: '#f0f0f0', // Default background color
    showHomeContent: false, // Whether to show the home content
    showInitContent: true, // Whether to show the initial welcome content
    topic: '', // Input field value for creating a new topic
    topics: [], // List of topics fetched from the server
    selectedTopicId: null, // ID of the currently selected topic
    error: null, // Error message for display
    isLoading: false // Loading state for async operations
};

// Reducer function to manage application state transitions
function appReducer(state, action) {
    switch (action.type) {
        case 'SET_HOME_CONTENT':
            // Toggles between home content and initial screen
            return {
                ...state,
                showHomeContent: action.payload,
                showInitContent: !action.payload
            };
        case 'SET_SELECTED_TOPIC':
            // Updates the currently selected topic ID
            return {
                ...state,
                selectedTopicId: action.payload
            };
        case 'SET_TOPICS':
            // Updates the list of topics and clears errors
            return {
                ...state,
                topics: action.payload,
                error: null
            };
        case 'SET_ERROR':
            // Sets an error message for display
            return {
                ...state,
                error: action.payload
            };
        case 'SET_LOADING':
            // Toggles the loading state
            return {
                ...state,
                isLoading: action.payload
            };
        case 'SET_TOPIC_INPUT':
            // Updates the topic input field
            return {
                ...state,
                topic: action.payload
            };
        case 'RESET_TOPIC_INPUT':
            // Clears the topic input field
            return {
                ...state,
                topic: ''
            };
        default:
            return state;
    }
}

function App({ user, signOut }) {
    // useReducer hook to manage the state using the reducer function
    const [state, dispatch] = useReducer(appReducer, initialState);

    // State for storing the authenticated user's ID
    // For testing purposes set to "7f2c6cd3-82df-41a8-bc82-152538968f51"
    const [userId, setUserId] = useState("7f2c6cd3-82df-41a8-bc82-152538968f51");

    // Updates the user ID when the user logs in
    useEffect(() => {
        if (user?.attributes?.sub) {
            const currentUserId = user.attributes.sub;
            setUserId(currentUserId);
            localStorage.setItem('userId', currentUserId); // Cache user ID in localStorage
        }
    }, [user]);

    // Fetches topics when the home content is toggled
    useEffect(() => {
        if (state.showHomeContent) {
            fetchTopics();
        }
    }, [state.showHomeContent]);

    // Initializes user ID from local storage (if available) on app load
    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
            setUserId(storedUserId);
        }
    }, []);

    // Function to fetch topics from the server
    const fetchTopics = async () => {
        dispatch({ type: 'SET_LOADING', payload: true }); // Set loading state
        dispatch({ type: 'SET_ERROR', payload: null }); // Clear previous errors

        try {
            const topicData = await client.graphql({
                query: ListTopicsWithPosts // Execute GraphQL query
            });
            dispatch({
                type: 'SET_TOPICS',
                payload: topicData.data.listTopics.items // Update topics state
            });
        } catch (error) {
            console.error("Error fetching topics:", error);
            dispatch({
                type: 'SET_ERROR',
                payload: "Failed to load topics. Please try again later." // Show error message
            });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false }); // End loading state
        }
    };

    // Navigates to the home page content
    const handleHomePageClick = () => {
        dispatch({ type: 'SET_HOME_CONTENT', payload: true });
        dispatch({ type: 'SET_SELECTED_TOPIC', payload: null }); // Deselect any topic
    };

    // Navigates back to the initial screen
    const handleBackButtonClick = () => {
        dispatch({ type: 'SET_HOME_CONTENT', payload: false });
        dispatch({ type: 'SET_SELECTED_TOPIC', payload: null });
    };

    // Updates the topic input field when the user types
    const handleInputChange = (event) => {
        dispatch({
            type: 'SET_TOPIC_INPUT',
            payload: event.target.value
        });
    };

    // Handles the creation of a new topic
    const handleCreateTopic = async () => {
        const trimmedTopic = state.topic.trim(); // Remove unnecessary whitespace

        if (trimmedTopic === '') {
            // Display an error if the input is empty
            dispatch({
                type: 'SET_ERROR',
                payload: "Please enter a topic."
            });
            return;
        }

        dispatch({ type: 'SET_LOADING', payload: true });

        try {
            // Create the topic using a GraphQL mutation
            await client.graphql({
                query: createTopic,
                variables: { input: { title: trimmedTopic } }
            });

            dispatch({ type: 'RESET_TOPIC_INPUT' }); // Clear input
            dispatch({ type: 'SET_ERROR', payload: null }); // Clear errors
            await fetchTopics(); // Refresh the topics list
        } catch (error) {
            console.error("Error creating topic:", error);
            dispatch({
                type: 'SET_ERROR',
                payload: "Failed to create topic. Please try again."
            });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    // Handles the selection of a topic
    const handleTopicClick = (topicId) => {
        dispatch({ type: 'SET_SELECTED_TOPIC', payload: topicId }); //
    };

    return (
        <div className="App">
            <main>
                {/* Initial content (Menu Screen) with navigation buttons */}
                {state.showInitContent && (
                    <header className='App-header'>
                        {/* Render navigation buttons dynamically from an array */}
                        {['Home Page', 'Followed Topics', 'For You', 'Your Posts'].map((buttonText) => (
                            <button
                                key={buttonText} // Unique key for React's reconciliation
                                onClick={handleHomePageClick} // Click handler for navigation
                                className="nav-button"
                            >
                                {buttonText} {/* Display button label */}
                            </button>
                        ))}
                        {/* Sign Out button */}
                        <button
                            onClick={signOut} // Logs the user out
                            className="nav-button sign-out"
                        >
                            Sign Out
                        </button>
                    </header>
                )}

                {/* Home content: Topic creation and topic list display */}
                {state.showHomeContent && !state.selectedTopicId && (
                    <div className="home-content">
                        <div className="home-content-container">
                            {/* Topic creation section */}
                            <div className="topic-creation-section">
                                <label htmlFor="topicInput">Create New Topic</label>
                                {/* Input field for entering a new topic */}
                                <input
                                    id="topicInput"
                                    type="text"
                                    placeholder="Type your topic here..." // Placeholder text for guidance
                                    value={state.topic} // Controlled input bound to state
                                    onChange={handleInputChange} // Updates state on input change
                                    className="topic-input"
                                />
                                <button
                                    onClick={handleCreateTopic} // Triggers topic creation
                                    disabled={state.isLoading} // Disables button while loading
                                    className="create-topic-button"
                                >
                                    {state.isLoading ? 'Creating...' : 'Create Topic'} {/* Dynamic button label */}
                                </button>

                                {/* Search bar */}
                                <label htmlFor="postInput">Search</label>
                                <input
                                    id="postInput"
                                    type="text"
                                    placeholder="Type your search here..." // Placeholder for search
                                    className="search-input"
                                />
                            </div>

                            {/* Topics list section */}
                            <div className="topics-list-section">
                                <h2>Popular Topics</h2>
                                {/* Error message display */}
                                {state.error && (
                                    <div className="error-message">{state.error}</div>
                                )}
                                {/* Loading spinner */}
                                {state.isLoading ? (
                                    <div className="loading-spinner">Loading...</div>
                                ) : (
                                    <div className="topics-grid">
                                        {/* Map over topics array to display individual topics */}
                                        {state.topics.map((topic) => {
                                            const postCount = topic.posts?.items?.length || 0; // Calculate the number of posts
                                            return (
                                                <div
                                                    key={topic.id} // Unique key for each topic
                                                    onClick={() => handleTopicClick(topic.id)} // Sets the selected topic
                                                    className={`topic-item ${postCount === 0 ? 'empty-topic' : ''}`}
                                                >
                                                    {/* Topic details */}
                                                    <div className="topic-details">
                                                        <h3>{topic.title}</h3> {/* Display topic title */}
                                                        {postCount === 0 && (
                                                            <p className="no-posts-text">
                                                                No posts yet - Be the first to contribute!
                                                            </p>
                                                        )}
                                                    </div>
                                                    {/* Post count display */}
                                                    <div className={`post-count ${postCount === 0 ? 'empty' : 'active'}`}>
                                                        {postCount} {postCount === 1 ? 'post' : 'posts'}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Back button to return to the menu */}
                        <button
                            onClick={handleBackButtonClick} // Triggers back navigation
                            className="back-button"
                        >
                            ← Back to Menu
                        </button>
                    </div>
                )}

                {/* Topic-specific content: Displays detailed view of a selected topic */}
                {state.selectedTopicId && userId && (
                    <TopicPage
                        topicId={state.selectedTopicId} // Passes the selected topic ID
                        userId={userId} // Passes the current user ID
                        onBack={() => dispatch({ type: 'SET_SELECTED_TOPIC', payload: null })} // Resets the selected topic
                    />
                )}
            </main>
        </div>
    );
}

export default withAuthenticator(App);
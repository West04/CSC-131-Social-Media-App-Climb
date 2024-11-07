import { API, graphqlOperation } from 'aws-amplify';
import { createUser, updateUser, deleteUser } from './graphql/mutations';
import { getUser } from './graphql/queries';

// Fetch User by Username
export const fetchUser = async (username) => {
    const input = { username };
    try {
        const response = await API.graphql(graphqlOperation(getUser, { input }));
        return response.data.getUser;
    } catch (error) {
        console.error('Error fetching user:', error);
        throw new Error('Could not fetch user');
    }
};

// Create a New User
export const createNewUser = async (userDetails) => {
    try {
        const response = await API.graphql(graphqlOperation(createUser, { input: userDetails }));
        return response.data.createUser;
    } catch (error) {
        console.error('Error creating user:', error);
        throw new Error('Could not create user');
    }
};

// Update Existing User
export const updateExistingUser = async (userDetails) => {
    try {
        const response = await API.graphql(graphqlOperation(updateUser, { input: userDetails }));
        return response.data.updateUser;
    } catch (error) {
        console.error('Error updating user:', error);
        throw new Error('Could not update user');
    }
};

// Delete User by Username
export const deleteExistingUser = async (username) => {
    const input = { username };
    try {
        const response = await API.graphql(graphqlOperation(deleteUser, { input }));
        return response.data.deleteUser;
    } catch (error) {
        console.error('Error deleting user:', error);
        throw new Error('Could not delete user');
    }
};

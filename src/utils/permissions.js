/**
 * Utility functions for checking user permissions
 */

/**
 * Check if a user can edit an event
 * @param {Object} user - The current user
 * @param {Object} event - The event to check
 * @returns {boolean} - True if user can edit the event
 */
export const canEditEvent = (user, event) => {
  if (!user || !event) return false;
  
  // Admin can edit any event
  if (user.role === 'admin') return true;
  
  // Event creator can edit their own event
  // Check both UUID (new) and email (backward compatibility)
  const isEventCreator = event.created_by === user.id || event.created_by === user.email;
  
  return isEventCreator;
};

/**
 * Check if a user can delete an event
 * @param {Object} user - The current user
 * @param {Object} event - The event to check
 * @returns {boolean} - True if user can delete the event
 */
export const canDeleteEvent = (user, event) => {
  // Same permissions as editing for now
  return canEditEvent(user, event);
};

/**
 * Check if a user can view event management features
 * @param {Object} user - The current user
 * @param {Object} event - The event to check
 * @returns {boolean} - True if user can manage the event
 */
export const canManageEvent = (user, event) => {
  return canEditEvent(user, event);
};

/**
 * Check if a user is an admin
 * @param {Object} user - The current user
 * @returns {boolean} - True if user is admin
 */
export const isAdmin = (user) => {
  return user?.role === 'admin';
};

/**
 * Check if a user is the creator of an event
 * @param {Object} user - The current user
 * @param {Object} event - The event to check
 * @returns {boolean} - True if user created the event
 */
export const isEventCreator = (user, event) => {
  if (!user || !event) return false;
  
  // Check both UUID (new) and email (backward compatibility)
  return event.created_by === user.id || event.created_by === user.email;
};

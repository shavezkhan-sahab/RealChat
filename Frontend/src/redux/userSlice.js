import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    userData: null,
    otherUsers: null,
  },
  reducers: {
    setUserData: (state, action) => {
      state.userData = action.payload;
    },
    setOtherUsers: (state, action) => {
      state.otherUsers = action.payload;
    },
    // Called via socket when any user updates their profile picture
    updateUserImage: (state, action) => {
      const { userId, imageUrl } = action.payload;
      if (state.otherUsers) {
        const user = state.otherUsers.find((u) => u._id === userId);
        if (user) user.image = imageUrl;
      }
      // Also update own userData if it's the current user
      if (state.userData?._id === userId) {
        state.userData.image = imageUrl;
      }
    },
  },
});

export const { setUserData, setOtherUsers, updateUserImage } = userSlice.actions;
export default userSlice.reducer;

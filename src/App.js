import React from "react";
import { Admin, Resource } from "react-admin";
import { AuthProvider, base64Uploader, RestProvider } from "./lib";
import simpleRestProvider from "ra-data-simple-rest";

import { PostList, PostEdit, PostCreate, PostIcon } from "./posts";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_DATABASE_URL,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID
};

const trackedResources = [{ name: "posts", isPublic: true }];

const authConfig = {
  userProfilePath: "/users/",
  userAdminProp: "isAdmin"
};

const dataProvider = base64Uploader(
  RestProvider(firebaseConfig, { trackedResources })
);

function App() {
  return (
    <Admin dataProvider={dataProvider} authProvider={AuthProvider(authConfig)}>
      <Resource
        name="posts"
        list={PostList}
        edit={PostEdit}
        create={PostCreate}
        icon={PostIcon}
      />
    </Admin>
  );
}

export default App;

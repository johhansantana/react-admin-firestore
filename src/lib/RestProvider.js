import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import Methods from "./methods";

import {
  GET_LIST,
  GET_ONE,
  GET_MANY,
  GET_MANY_REFERENCE,
  CREATE,
  UPDATE,
  DELETE,
  DELETE_MANY
} from "react-admin";

/**
 * @param {string[]|Object[]} trackedResources Array of resource names or array of Objects containing name and
 * optional path properties (path defaults to name)
 * @param {Object} firebaseConfig Options Firebase configuration
 */

const BaseConfiguration = {
  initialQuerytimeout: 10000,
  timestampFieldNames: {
    createdAt: "createdAt",
    updatedAt: "updatedAt"
  }
};

const RestProvider = (firebaseConfig = {}, options = {}) => {
  options = Object.assign({}, BaseConfiguration, options);
  const { timestampFieldNames, trackedResources } = options;

  const resourcesStatus = {};
  // const resourcesReferences = {};
  const resourcesData = {};
  const resourcesPaths = {};
  const resourcesUploadFields = {};

  if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);
    firebase.firestore().settings({
      timestampsInSnapshots: true
    });
  }

  /* Functions */
  const upload = options.upload || Methods.upload;
  const save = options.save || Methods.save;
  const del = options.del || Methods.del;
  const getItemID = options.getItemID || Methods.getItemID;
  const getOne = options.getOne || Methods.getOne;
  const getMany = options.getMany || Methods.getMany;
  const getManyReference = options.getManyReference || Methods.getManyReference;
  const delMany = options.delMany || Methods.delMany;
  const getList = options.getList || Methods.getList;

  const firebaseSaveFilter = options.firebaseSaveFilter
    ? options.firebaseSaveFilter
    : data => data;
  // const firebaseGetFilter = options.firebaseGetFilter ? options.firebaseGetFilter : data => data;

  // Sanitize Resources
  trackedResources.map((resource, index) => {
    if (typeof resource === "string") {
      resource = {
        name: resource,
        path: resource,
        uploadFields: []
      };
      trackedResources[index] = resource;
    }

    const { name, path, uploadFields } = resource;
    if (!resource.name) {
      throw new Error(`name is missing from resource ${resource}`);
    }
    resourcesUploadFields[name] = uploadFields || [];
    resourcesPaths[name] = path || name;
    resourcesData[name] = {};
  });

  /**
   * @param {string} type Request type, e.g GET_LIST
   * @param {string} resourceName Resource name, e.g. "posts"
   * @param {Object} payload Request parameters. Depends on the request type
   * @returns {Promise} the Promise for a REST response
   */

  return async (type, resourceName, params) => {
    await resourcesStatus[resourceName];
    let result = null;
    switch (type) {
      case GET_LIST:
        // console.log('GET_LIST');
        result = await getList(
          params,
          resourceName,
          resourcesData[resourceName]
        );
        return result;
      case GET_MANY:
        result = await getMany(
          params,
          resourceName,
          resourcesData[resourceName]
        );
        // console.log('GET_MANY');
        return result;

      case GET_MANY_REFERENCE:
        // console.log('GET_MANY_REFERENCE');
        result = await getManyReference(
          params,
          resourceName,
          resourcesData[resourceName]
        );
        return result;

      case GET_ONE:
        // console.log('GET_ONE');
        result = await getOne(
          params,
          resourceName,
          resourcesData[resourceName]
        );
        return result;

      case DELETE:
        // console.log('DELETE');
        const uploadFields = resourcesUploadFields[resourceName]
          ? resourcesUploadFields[resourceName]
          : [];
        result = await del(
          params.id,
          resourceName,
          resourcesPaths[resourceName],
          uploadFields
        );
        return result;

      case DELETE_MANY:
        // console.log('DELETE_MANY');
        result = await delMany(
          params.ids,
          resourceName,
          resourcesData[resourceName]
        );
        return result;
      case UPDATE:
      case CREATE:
        // console.log('UPDATE/CREATE');
        let itemId = getItemID(
          params,
          type,
          resourceName,
          resourcesPaths[resourceName],
          resourcesData[resourceName]
        );
        const uploads = resourcesUploadFields[resourceName]
          ? resourcesUploadFields[resourceName].map(field =>
              upload(
                field,
                params.data,
                itemId,
                resourceName,
                resourcesPaths[resourceName]
              )
            )
          : [];
        const currentData = resourcesData[resourceName][itemId] || {};
        const uploadResults = await Promise.all(uploads);

        result = await save(
          itemId,
          params.data,
          currentData,
          resourceName,
          resourcesPaths[resourceName],
          firebaseSaveFilter,
          uploadResults,
          type === CREATE,
          timestampFieldNames
        );
        return result;

      default:
        console.error("Undocumented method: ", type);
        return { data: [] };
    }
  };
};

export default RestProvider;

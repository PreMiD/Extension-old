import axios from "axios";

import { apiBase } from "../../config";
import cleanObject from "./cleanObject";

export default async function graphqlRequest(query: string) {
	const res = await axios({
		url: apiBase,
		method: "post",
		data: {
			query: query
		}
	});
	cleanObject(res.data);

	return res.data;
}

export async function getPresenceMetadata(presence: string) {
	const result = await graphqlRequest(`
    query {
      presences(service: "${presence}") {
        url
        metadata {
          author {
            id
            name
          }
          contributors {
            id
            name
          }
          altnames
          warning
          readLogs
          button
          service
          description
          url
          version
          logo
          thumbnail
          color
          tags
          category
          iframe
          regExp
          iframeRegExp
          settings {
            id
            title
            icon
            if {
              propretyNames
              patternProprties
            }
            placeholder
            value
            values
            multiLanguage
          }
        }
      }
    }`);
	cleanObject(result.data);
	const final = {
		data: {
			name: result.data.presences[0].metadata.service,
			url: result.data.presences[0].url,
			metadata: result.data.presences[0].metadata
		}
	};
	return final;
}

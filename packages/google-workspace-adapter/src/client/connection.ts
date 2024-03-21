/*
 *                      Copyright 2024 Salto Labs Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { AccountInfo } from '@salto-io/adapter-api'
import { client as clientUtils } from '@salto-io/adapter-components'
import { logger } from '@salto-io/logging'
import { OAuth2Client } from 'google-auth-library'
import http from 'http'
import url from 'url'
import open from 'open'
import { Credentials } from '../auth'

const log = logger(module)

/**
 * Create a new OAuth2Client, and go through the OAuth2 content
 * workflow.  Return the full client to the callback.
 */
const getAuthenticatedClient = ({
  clientId,
  clientSecret,
  redirectUri,
}: {
  clientId: string
  clientSecret: string
  redirectUri: string
}): Promise<OAuth2Client> =>
  new Promise((resolve, reject) => {
    // create an oAuth client to authorize the API call.  Secrets are kept in a `keys.json` file,
    // which should be downloaded from the Google Developers Console.
    const oAuth2Client = new OAuth2Client(clientId, clientSecret, redirectUri)

    // Generate the url that will be used for the consent dialog.
    const authorizeUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: 'https://www.googleapis.com/auth/userinfo.profile',
    })

    // Open an http server to accept the oauth callback. In this simple example, the
    // only request to our webserver is to /oauth2callback?code=<code>
    const server = http
      .createServer(async (req, res) => {
        try {
          if (req.url !== undefined && req.url.indexOf('/oauth2callback') > -1) {
            // acquire the code from the querystring, and close the web server.
            const qs = new url.URL(req.url, 'http://localhost:3000').searchParams
            const code = qs.get('code')
            // eslint-disable-next-line no-console
            console.log(`Code is ${code}`)
            res.end('Authentication successful! Please return to the console.')
            // server.destroy()

            if (code !== null) {
              // Now that we have the code, use that to acquire tokens.
              const r = await oAuth2Client.getToken(code)
              // Make sure to set the credentials on the OAuth2 client.
              oAuth2Client.setCredentials(r.tokens)
              // eslint-disable-next-line no-console
              console.info('Tokens acquired.')
              resolve(oAuth2Client)
            }
          }
        } catch (e) {
          reject(e)
        }
      })
      .listen(3000, async () => {
        // open the browser to the authorize url to start the workflow
        await open(authorizeUrl, { wait: false }).then((cp: { unref: () => unknown }) => cp.unref())
      })
    // destroyer(server)
    return server
  })

export const validateCredentials = async ({
  connection,
}: {
  // credentials: Credentials
  connection: clientUtils.APIConnection
}): Promise<AccountInfo> => {
  try {
    await connection.get('https://www.googleapis.com/oauth2/v1/userinfo')
    return { accountId: '' }
  } catch (e) {
    log.error('Failed to validate credentials: %s', e)
    throw new clientUtils.UnauthorizedError(e)
  }
}

export const createConnection: clientUtils.ConnectionCreator<Credentials> = retryOptions =>
  clientUtils.axiosConnection({
    retryOptions,
    baseURLFunc: async () => '', // TODO replace with base URL, creds can be used
    authParamsFunc: async (credentials: Credentials) => {
      const oAuth2Client = await getAuthenticatedClient(credentials)
      // Make a simple request to the People API using our pre-authenticated client. The `request()` method
      // takes an GaxiosOptions object.  Visit https://github.com/JustinBeckwith/gaxios.
      const urlToUse = 'https://people.googleapis.com/v1/people/me?personFields=names'
      const res = await oAuth2Client.request({ url: urlToUse })
      // eslint-disable-next-line no-console
      console.log(res.data)

      // After acquiring an access_token, you may want to check on the audience, expiration,
      // or original scopes requested.  You can do that with the `getTokenInfo` method.
      const tokenInfo = await oAuth2Client.getTokenInfo(oAuth2Client.credentials.access_token ?? '')
      // eslint-disable-next-line no-console
      console.log(tokenInfo)
      return {
        url: 'https://www.googleapis.com/oauth2/v1/userinfo',
        headers: { Authorization: `Bearer ${oAuth2Client.credentials.access_token}` },
      }
    },
    credValidateFunc: validateCredentials,
  })

import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
import axios from 'axios';
import { GetBlockResponse, GetPageResponse } from '@notionhq/client/build/src/api-endpoints';
import { Link } from 'routes/connect/v01/types';
import { urlify } from 'routes/connect/v01/links';

dotenv.config();

const clientId = 'ec770c41-07f8-44bd-a4d8-66d30e9786c8';
const redirectUrl = 'https://api.mintlify.com/connect/notion/authorization';

export const isNotionUrl = (url: URL): boolean => {
    return url.host === 'www.notion.so' || url.host === 'notion.so';
}

export const getPageId = (url: URL): string => {
    const { pathname } = url;
    const index = pathname.lastIndexOf('-') + 1;
    const pageId = pathname.slice(index);
    return pageId;
};

export const isBlock = (url: URL): boolean => {
    return url.hash !== '';
}

export const getBlockId = (url: URL): string => {
    const { hash } = url;
    return hash.slice(1);
}

type AdjustedBlockResponse <T> = Partial<T>
   & { type?: string }

type AdjustedPageResponse <T> = Partial<T>
   & { 
       icon?: {
           type?: string,
           emoji?: string 
       }
        properties?: {
        title?: { title: {
            text: {
                content: string
            }
        }[]}
   }}

export const getNotionPageTitle = async (link: Link, notionAccessToken: string): Promise<string> => {
    try {
        const url = new URL(urlify(link.url));
        const notion = new Client({ auth: notionAccessToken });
        const pageId = getPageId(url);
        const response: AdjustedPageResponse<GetPageResponse> = await notion.pages.retrieve({ page_id: pageId });
        let title = response.properties.title.title[0].text.content;
        if (response.icon.type === 'emoji') {
            title = `${response.icon.emoji} ${title}`
        }
        return title ?? '';
    }
    catch (err) {
        return ''
    }
}

export const getNotionBlockContent = async (link: Link, notionAccessToken: string): Promise<string> => {
    try {
        const url = new URL(urlify(link.url));
        const notion = new Client({ auth: notionAccessToken });
        const blockId = getBlockId(url);
        const response: AdjustedBlockResponse<GetBlockResponse> = await notion.blocks.retrieve({
            block_id: blockId,
        });
        const type = response?.type;
        return response[type].rich_text[0].text.content ?? response[type].url ?? response[type].external.url ?? '';
        
    }
    catch (err) {
        return ''
    }
}

export const getNotionContent = async (link: Link, notionAccessToken: string): Promise<string> => {
    try {
        const url = new URL(urlify(link.url));
        const notion = new Client({ auth: notionAccessToken });
        if (isBlock(url)) {
            const blockId = getBlockId(url);
            const response: AdjustedBlockResponse<GetBlockResponse> = await notion.blocks.retrieve({
                block_id: blockId,
            });
            const type = response?.type;
            return response[type].rich_text[0].text.content ?? response[type].url ?? response[type].external.url ?? '';
        } else { // page
            const pageId = getPageId(url);
            const response: AdjustedPageResponse<GetPageResponse> = await notion.pages.retrieve({ page_id: pageId });
            let title = response.properties.title.title[0].text.content;
            if (response.icon.type === 'emoji') {
                title = `${response.icon.emoji} ${title}`
            }
            return title ?? '';
        }
    }
    catch (err) {
        return ''
    }
}

export const getNotionURL = (state?: string) => {
    const url = new URL('https://api.notion.com/v1/oauth/authorize');
    url.searchParams.append('owner', 'user');
    url.searchParams.append('client_id', clientId);
    url.searchParams.append('redirect_uri', redirectUrl);
    url.searchParams.append('response_type', 'code');
    if (state) {
        url.searchParams.append('state', state);
    }
    return url.toString();
}

type NotionAuthResponse = {
    access_token: string,
    bot_id: string,
    workspace_name: string,
    workspace_icon: string,
    workspace_id: string,
}

type NotionAuthData = {
    response?: NotionAuthResponse,
    error?: string
}

export const getNotionAccessTokenFromCode = async (code: string): Promise<NotionAuthData> => {
    const token = `${clientId}:${process.env.NOTION_OAUTH_SECRET}`;
    const encodedToken = Buffer.from(token, 'utf8').toString('base64');

    try {
        const { data }: { data: NotionAuthResponse } = await axios.post('https://api.notion.com/v1/oauth/token',
            { grant_type: 'authorization_code', code, redirect_uri: redirectUrl },
            { headers: { 'Authorization': `Basic ${encodedToken}` } }
        );
        return { response: data }
    }

    catch (error) {
        return { error }
    }
}
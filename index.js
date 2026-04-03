import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";
const server=new McpServer({
    name:"example-server",
    version:"1.0.0",
   })
server.tool(
    "add",
    "Add two numbers together",
    {
        a: z.number(),
        b: z.number(),
    },
    ({a,b})=>{
        return {
            content: [
                {
                    type: "text",
                    text: `The sum of ${a} and ${b} is ${a + b}`
                }
            ]
        }
    }

)
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
server.tool(
    "get_github_repos",
    "Get  github repos from the given username",
    {
        username:z.string(),
    },
    async ({username}) => { 
        const res=await axios.get(`https://api.github.com/users/${username}/repos`,{
            headers:{
                "User-Agent":"MCP-Server"}})
                if(res.status!==200){
                    throw new Error(`Failed to fetch repos for ${username}`)
                }
                const repolist=res.data.map((repo,idx)=>`${idx+1}. ${repo.name}`).join("\n")
                return {
                    content: [
                        {
                            type: "text",
                            text: `Repos for ${username}:\n${repolist}`
                        }
                    ]
                }
     }

)
main()
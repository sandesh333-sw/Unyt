import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function requireAuth(){
    const { userId } = await auth(); 

    if (!userId){
        return {
            authorized: false,
            response: NextResponse.json(
                { success: false, error: 'Unauthorized - Please sign in'},
                { status: 401 }
            ),
        };
    }

    return { authorized: true, userId};
}
"""
LLM Utility Module
Handles Azure OpenAI API calls
"""

import os
from openai import OpenAI
from config.settings import settings

# Singleton client
_client = None


def get_llm_client() -> OpenAI:
    """Get or create OpenAI client for Azure"""
    global _client
    
    if _client is None:
        if not settings.AZURE_OPENAI_API_KEY or not settings.AZURE_OPENAI_ENDPOINT:
            raise RuntimeError(
                "Azure OpenAI not configured. "
                "Set AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT in .env"
            )
        
        _client = OpenAI(
            api_key=settings.AZURE_OPENAI_API_KEY,
            base_url=settings.AZURE_OPENAI_ENDPOINT
        )
    
    return _client


def call_llm(system_prompt: str, user_prompt: str) -> str:
    """
    Make a synchronous call to Azure OpenAI
    """
    client = get_llm_client()
    
    response = client.chat.completions.create(
        model=settings.AZURE_OPENAI_DEPLOYMENT,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
        # Note: temperature parameter removed - not supported by all Azure models
    )
    
    return response.choices[0].message.content


async def call_llm_async(system_prompt: str, user_prompt: str) -> str:
    """
    Make an async call to Azure OpenAI
    Note: Using sync client in async context for simplicity
    For production, consider using httpx or aiohttp
    """
    return call_llm(system_prompt, user_prompt)
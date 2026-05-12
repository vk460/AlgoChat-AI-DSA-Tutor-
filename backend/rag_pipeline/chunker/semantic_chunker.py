import json
import os
from dataclasses import dataclass
from typing import Literal

@dataclass
class Chunk:
    chunk_id:    str
    topic:       str
    chunk_type:  Literal["concept", "code", "steps", "diagram", "misconception"]
    content:     str          
    metadata:    dict         
    source:      str          


def chunk_topic_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    topic = data["topic"]
    chunks = []

    # 1. Concept sections
    for i, section in enumerate(data["sections"]):
        if len(section["content"].strip()) < 30:
            continue

        chunks.append(Chunk(
            chunk_id   = f"{topic}_concept_{i}",
            topic      = topic,
            chunk_type = "concept",
            content    = f"{section['heading']}.\n{section['content']}",
            metadata   = {"heading": section["heading"], "source_url": data["url"]},
            source     = "gfg"
        ))

    # 2. Code examples
    for i, ex in enumerate(data["code_examples"]):
        chunks.append(Chunk(
            chunk_id   = f"{topic}_code_{i}",
            topic      = topic,
            chunk_type = "code",
            content    = f"Code implementation for {topic}. Context: {ex['context']}. Section: {ex['section']}",
            metadata   = {
                "code": ex["code"],
                "context": ex["context"],
                "section": ex["section"],
            },
            source     = "gfg"
        ))

    # 3. Algorithm steps
    for i, step_group in enumerate(data["steps"]):
        steps_text = " ".join(f"Step {j+1}: {s}" for j, s in enumerate(step_group["steps"]))
        chunks.append(Chunk(
            chunk_id   = f"{topic}_steps_{i}",
            topic      = topic,
            chunk_type = "steps",
            content    = f"Step-by-step procedure for {topic}. {step_group['heading']}. {steps_text}",
            metadata   = {
                "heading": step_group["heading"],
                "steps": step_group["steps"],
            },
            source     = "gfg"
        ))

    # 4. Diagrams
    for i, diag in enumerate(data["diagrams"]):
        if not diag["caption"]: continue

        chunks.append(Chunk(
            chunk_id   = f"{topic}_diagram_{i}",
            topic      = topic,
            chunk_type = "diagram",
            content    = f"Visualization for {topic}. Shows: {diag['caption']}. Located in section: {diag['section']}",
            metadata   = {
                "caption": diag["caption"],
                "base64":  diag["base64"],
                "section": diag["section"],
            },
            source     = "gfg"
        ))

    return chunks

def get_all_chunks():
    all_chunks = []
    folder = "f:/GEN_AI_ASSISTANT/backend/data/raw/structured"
    
    if not os.path.exists(folder):
        return []

    for filename in os.listdir(folder):
        if filename.endswith(".json"):
            chunks = chunk_topic_file(os.path.join(folder, filename))
            all_chunks.extend(chunks)
    
    return all_chunks

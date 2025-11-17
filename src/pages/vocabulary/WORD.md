# Word Statistics API Documentation

## Overview
The Word Statistics API provides analytics endpoints for tracking and analyzing word usage patterns, including top words and lemmas for both individual users and globally across the system. Data is stored in Typesense for fast aggregation and real-time analytics.

## Base URL
```
http://localhost:8080/api
```

## Authentication
User-specific endpoints require JWT authentication via the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

Global endpoints are publicly accessible and do not require authentication.

---

## Endpoints

### 1. Get User's Top Words
Retrieve the most frequently accessed words for the authenticated user within a specified time period.

**Endpoint:** `GET /words/stats/user/top-words`

**Authentication:** Required (JWT)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| period | string | No | Time period for analysis: `day`, `week`, `month`, `year` (default: `week`) |
| limit | integer | No | Number of top words to return (default: 10, max: 100) |

**Request Example:**
```bash
curl -X GET "http://localhost:8080/api/words/stats/user/top-words?period=week&limit=20" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response Success (200 OK):**
```json
{
  "period": "week",
  "limit": 20,
  "top_words": [
    {
      "word": "食べる",
      "lemma": "食べる",
      "pos": "verb",
      "count": 15,
      "write_count": 3
    },
    {
      "word": "行く",
      "lemma": "行く",
      "pos": "verb", 
      "count": 12,
      "write_count": 2
    },
    {
      "word": "勉強",
      "lemma": "勉強",
      "pos": "noun",
      "count": 8,
      "write_count": 1
    }
  ]
}
```

**Response Fields:**
- `period`: The time period used for the analysis
- `limit`: The maximum number of results requested
- `top_words`: Array of word statistics objects
  - `word`: The Japanese word
  - `lemma`: The dictionary form of the word (may be null)
  - `pos`: Part of speech
  - `count`: Number of times the word was accessed in the period
  - `write_count`: Accumulated write count from user word entries

### 2. Get User's Top Lemmas
Retrieve the most frequently accessed dictionary forms (lemmas) for the authenticated user within a specified time period.

**Endpoint:** `GET /words/stats/user/top-lemmas`

**Authentication:** Required (JWT)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| period | string | No | Time period for analysis: `day`, `week`, `month`, `year` (default: `week`) |
| limit | integer | No | Number of top lemmas to return (default: 10, max: 100) |

**Request Example:**
```bash
curl -X GET "http://localhost:8080/api/words/stats/user/top-lemmas?period=month&limit=15" \
  -H "Authorization: Bearer your_jwt_token"
```

**Response Success (200 OK):**
```json
{
  "period": "month",
  "limit": 15,
  "top_lemmas": [
    {
      "lemma": "食べる",
      "pos": "verb",
      "count": 45,
      "write_count": 8
    },
    {
      "lemma": "行く",
      "pos": "verb",
      "count": 38,
      "write_count": 5
    },
    {
      "lemma": "勉強する",
      "pos": "verb",
      "count": 22,
      "write_count": 3
    }
  ]
}
```

**Response Fields:**
- `period`: The time period used for the analysis
- `limit`: The maximum number of results requested
- `top_lemmas`: Array of lemma statistics objects
  - `lemma`: The dictionary form of the word
  - `pos`: Part of speech
  - `count`: Number of times the lemma was accessed in the period
  - `write_count`: Accumulated write count from user word entries

### 3. Get Global Top Words
Retrieve the most frequently accessed words across all users within a specified time period.

**Endpoint:** `GET /words/stats/global/top-words`

**Authentication:** Not required (Public)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| period | string | No | Time period for analysis: `day`, `week`, `month`, `year` (default: `week`) |
| limit | integer | No | Number of top words to return (default: 10, max: 100) |

**Request Example:**
```bash
curl -X GET "http://localhost:8080/api/words/stats/global/top-words?period=week&limit=25"
```

**Response Success (200 OK):**
```json
{
  "period": "week",
  "limit": 25,
  "top_words": [
    {
      "word": "する",
      "lemma": "する",
      "pos": "verb",
      "count": 1250,
      "write_count": 450
    },
    {
      "word": "ある",
      "lemma": "ある",
      "pos": "verb",
      "count": 980,
      "write_count": 320
    },
    {
      "word": "いる",
      "lemma": "いる",
      "pos": "verb",
      "count": 850,
      "write_count": 280
    }
  ]
}
```

**Response Fields:**
- `period`: The time period used for the analysis
- `limit`: The maximum number of results requested
- `top_words`: Array of word statistics objects (same structure as user top words)

### 4. Get Global Top Lemmas
Retrieve the most frequently accessed dictionary forms (lemmas) across all users within a specified time period.

**Endpoint:** `GET /words/stats/global/top-lemmas`

**Authentication:** Not required (Public)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| period | string | No | Time period for analysis: `day`, `week`, `month`, `year` (default: `week`) |
| limit | integer | No | Number of top lemmas to return (default: 10, max: 100) |

**Request Example:**
```bash
curl -X GET "http://localhost:8080/api/words/stats/global/top-lemmas?period=year&limit=50"
```

**Response Success (200 OK):**
```json
{
  "period": "year",
  "limit": 50,
  "top_lemmas": [
    {
      "lemma": "する",
      "pos": "verb",
      "count": 15800,
      "write_count": 5200
    },
    {
      "lemma": "ある",
      "pos": "verb",
      "count": 13200,
      "write_count": 4100
    },
    {
      "lemma": "いる",
      "pos": "verb",
      "count": 11500,
      "write_count": 3800
    }
  ]
}
```

**Response Fields:**
- `period`: The time period used for the analysis
- `limit`: The maximum number of results requested
- `top_lemmas`: Array of lemma statistics objects (same structure as user top lemmas)

## Error Responses

### 400 Bad Request
```json
{
  "error": {
    "code": "INVALID_PERIOD",
    "message": "Invalid period: invalid_period"
  }
}
```

### 401 Unauthorized (User endpoints only)
```json
{
  "error": {
    "code": "USER_NOT_AUTHENTICATED",
    "message": "user not authenticated"
  }
}
```

### 500 Internal Server Error
```json
{
  "error": {
    "code": "DATABASE_QUERY_ERROR",
    "message": "Failed to search user top words: connection timeout"
  }
}
```

## Period Options

The following time periods are supported for all endpoints:

| Period | Description | Time Range |
|--------|-------------|------------|
| `day` | Last 24 hours | Now - 1 day |
| `week` | Last 7 days | Now - 7 days (default) |
| `month` | Last 30 days | Now - 1 month |
| `year` | Last 365 days | Now - 1 year |

## Data Storage and Performance

Word statistics are stored in **Typesense** for fast aggregation and real-time analytics. Each word access is indexed with:
- User ID (for user-specific queries)
- Word details (word, lemma, POS)
- Write count tracking
- Timestamp with year/month/day/week components for efficient time-based filtering

The system uses Typesense's grouping and aggregation capabilities to provide fast responses even with large datasets.

## Use Cases

1. **Personal Learning Analytics**: Users can track their most studied words and identify learning patterns
2. **System-wide Trends**: Administrators can monitor popular vocabulary across all users
3. **Curriculum Planning**: Identify frequently accessed words to prioritize in learning materials
4. **Performance Optimization**: Cache popular queries and optimize resource allocation based on usage patterns

## Implementation Details

### Data Collection
Word statistics are automatically collected when users interact with words through:
- Translation requests
- Word lookups
- Vocabulary practice sessions
- Writing exercises

### Aggregation Logic
The system uses Typesense's powerful aggregation features to:
- Group words by their text or lemma
- Count occurrences within time windows
- Sort by frequency in descending order
- Apply user-specific or global filters

### Performance Characteristics
- **Response Time**: Typically under 100ms for most queries
- **Scalability**: Handles millions of word access records efficiently
- **Real-time**: New word accesses are available in analytics within seconds
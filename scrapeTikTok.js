async function scrapeTikTokPosts(username) {
    // First, fetch the user's secUid
    const userInfoUrl = `https://www.tiktok.com/node/share/user/@${username}`;
    const userInfoResponse = await axios.get(userInfoUrl, { headers });
    const secUid = userInfoResponse.data.userInfo.user.secUid;

    // Now use the secUid to fetch the user's posts
    const postsUrl = `https://www.tiktok.com/api/post/item_list/?aid=1988&secUid=${secUid}&count=30&cursor=0`;
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.tiktok.com/',
        // Add any necessary cookies or tokens here
    };

    try {
        const postsResponse = await axios.get(postsUrl, { headers });
        console.log('Raw response:', postsResponse.data);

        if (!postsResponse.data.itemList) {
            throw new Error('Unexpected response structure');
        }

        return postsResponse.data.itemList.map(post => ({
            createTime: post.createTime,
            desc: post.desc,
            id: post.id,
            stats: post.stats,
            video: post.video
        }));
    } catch (error) {
        console.error('Error fetching TikTok posts:', error.message);
        return [];
    }
}
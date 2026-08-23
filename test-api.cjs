async function test() {
  try {
    const res = await fetch('https://consumet-api-production.up.railway.app/meta/anilist/trending');
    const data = await res.json();
    console.log('Trending:', data.results?.length);
    
    if (data.results?.length > 0) {
      const firstId = data.results[0].id;
      console.log('First ID:', firstId);
      const detailsRes = await fetch(`https://consumet-api-production.up.railway.app/meta/anilist/info/${firstId}?provider=zoro`);
      const details = await detailsRes.json();
      console.log('Details episodes:', details.episodes?.length);
      
      if (details.episodes?.length > 0) {
        const epId = details.episodes[0].id;
        console.log('Fetching watch link for:', epId);
        const watchRes = await fetch(`https://consumet-api-production.up.railway.app/meta/anilist/watch/${encodeURIComponent(epId)}`);
        const watchData = await watchRes.json();
        console.log('Watch links:', watchData.sources?.length);
      }
    }
  } catch (err) {
    console.error(err);
  }
}
test();

# Product Price Comparator

The aim of this extension is allow users get the cheapest and most reliable products they search for on shopping sites, with a focus for Africa.

## How it'd do this?

- Extract product info from current shopping site.
	- With four possible extractors:
	  - Window global data extraction,
		- DOM `querySelector` scraping,
		- DOM schema.org data parsing,
		- and a backup and optional LLM data approximation using chunks of the DOM
- Get serach terms by using the product's name, and optionally, rewording it to obtain 2 extra more-search friendly terms. 
- Using this search terms:
	- search through search engines and pick the top 5-15 results.
		- Scrape through the results and extract their product info.
		  - This will either be done via playwright server-side, or in a hidden brwoser window client-side.
	- search through alternative shopping sites and scrape the top 5-15 product info from the results.
- Compare their prices and ratings with the original product and only return those that are cheaper, (and maybe those that are slightly costlier but have a higher rating).
- Return the links and products to the user for them to decide if it's worth it.
- This will be done with a floating icon injected into the active tab that'll activate the process. Accessing the popup will do similar

Now of course, there are two ways this can be done; on the client device, optionally using tensorflow models or on a remote server. The client-mode will certainly have it's warts :p

### How it'd scrape the shopping site

- Most shopping sites may have a global variable attached to the window containing the currently viewed product data. This will give the most accurate data but will not work generally.
- For general cases, fallback to regular DOM cleaning / screenshotting and use an external model to parse it.

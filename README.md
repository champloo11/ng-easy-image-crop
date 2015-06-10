# ngEasyImageCrop
Angular Directive for Easy Server-Side Image Cropping. Handles both original image and scaled image dimensions.

## Options / Bindings
```html
    	<div image-crop 
    		aspect-ratio="{string/string}" 
    		img-src="{string}" 
    		img-load="{string}" <!-- Image to display while loading change of resource --> 
    		display-height="{int}" 
    		display-width = "{int}"
    		scaled-height="{int}" 
    		scaled-width="{int}" 
    		scaled-top="{int}" 
    		scaled-left="{int}" 
    		style="position:relative;">
		</div>
```

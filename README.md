# ngEasyImageCrop
Angular Directive for Easy Server-Side Image Cropping. Handles both original image and scaled image dimensions. With additional support for dynamic aspect-ratio cropping. 

[Demo](http://outwitter.com/git/ngEasyImageCrop/example.html)



## Options / Bindings
```html
	<div 
        image-crop 
		aspect-ratio="'{int}/{int}'" 
		img-src="{string}" 
		img-load="{string}"
		display-height="{int}" 
		display-width = "{int}"
		scaled-height="{int}" 
		scaled-width="{int}" 
		scaled-top="{int}" 
		scaled-left="{int}" 
		style="position:relative;">
	</div>
```
